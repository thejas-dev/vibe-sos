'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { DetectAudioThreatOutput } from '@/ai/flows/detect-audio-threat';
import { detectAudioThreat } from '@/ai/flows/detect-audio-threat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SOSSlider } from '@/components/sos-slider';
import { StatusCard } from '@/components/status-card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, MapPin, Siren, Video, Radio, AlertTriangle, FileLock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [isSosActive, setIsSosActive] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [threatResult, setThreatResult] = useState<DetectAudioThreatOutput | null>(null);
  const [streamStatus, setStreamStatus] = useState('Inactive');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const locationWatcherId = useRef<number | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const logRef = useRef<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  const addLog = useCallback((message: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const cleanup = useCallback(() => {
    if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording') {
      audioRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (locationWatcherId.current !== null) {
      navigator.geolocation.clearWatch(locationWatcherId.current);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    audioRecorderRef.current = null;
    mediaStreamRef.current = null;
    locationWatcherId.current = null;
    setStreamStatus('Inactive');
  }, []);

  const handleDeactivateSOS = useCallback(() => {
    setIsSosActive(false);
    addLog('SOS Deactivated by user.');
    cleanup();
  }, [addLog, cleanup]);

  const startWebRTCStream = useCallback(async (stream: MediaStream) => {
    addLog('Attempting to start live stream to emergency services...');
    setStreamStatus('Connecting...');
    try {
      // Using a public STUN server. In a real app, you'd need TURN servers for NAT traversal.
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Update stream status based on connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState) {
          const status = pc.connectionState.charAt(0).toUpperCase() + pc.connectionState.slice(1);
          setStreamStatus(status);
          if (status !== 'Connecting') {
            addLog(`Live stream status: ${status}`);
          }
        }
      };

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // This part is for signaling. As there's no receiver, it will attempt to connect and likely timeout.
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real app, this candidate is sent to the remote peer via a signaling server.
          console.info('Simulating sending ICE candidate to remote peer.');
          fetch('/api/webrtc-signal', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type: 'ice-candidate', candidate: event.candidate, user_id: 'anonymous' })
          }).catch(err => console.info('Mock API call for WebRTC signaling (ICE). This is expected to fail.'));
        }
      };
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // In a real app, this offer (SDP) is sent to the remote peer.
      console.info('Simulating sending offer to remote peer.');
      fetch('/api/webrtc-signal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ type: 'offer', sdp: offer.sdp, user_id: 'anonymous' })
      }).catch(err => console.info('Mock API call for WebRTC signaling (Offer). This is expected to fail.'));

      addLog('WebRTC live stream initiated. Awaiting connection.');
      
    } catch (error) {
      console.error('WebRTC setup failed:', error);
      addLog('WebRTC stream could not be established.');
      setStreamStatus('Failed');
      // No toast error as requested.
    }
  }, [addLog]);

  const handleActivateSOS = useCallback(async () => {
    addLog('SOS activation sequence initiated...');
    if (isSosActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addLog('Camera and microphone access granted.');
      setIsSosActive(true);

      // Start live streaming via WebRTC
      await startWebRTCStream(stream);

      // Start geolocation tracking
      locationWatcherId.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          addLog('Location updated.');
        },
        () => {
          addLog('Error getting location.');
          toast({ title: 'Error', description: 'Could not get location.', variant: 'destructive' });
        }
      );

      // AI Threat Detection
      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream);
      audioRecorderRef.current = audioRecorder;

      audioRecorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;
        addLog('Capturing audio for analysis...');
        const audioBlob = new Blob([event.data], { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const audioDataUri = reader.result as string;
            const result = await detectAudioThreat({ audioDataUri });
            setThreatResult(result);
            addLog(`AI analysis complete. Confidence: ${Math.round(result.confidenceScore * 100)}%`);
            if (result.threatDetected) {
              addLog(`Threat detected: ${result.threatKeywords.join(', ')}`);
              addLog('High-priority alert dispatched to authorities with full log.');

              // Send a detailed alert with the threat info and the full log
              fetch('/api/alert', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  lat: location?.lat,
                  lng: location?.lng,
                  timestamp: new Date().toISOString(),
                  user_id: 'anonymous',
                  status: 'THREAT_DETECTED',
                  threatKeywords: result.threatKeywords,
                  log: logRef.current, // Send the complete log history
                })
              }).catch(err => console.info('Mock API call for threat detection.'));
            }
          } catch (e) {
            addLog('AI analysis failed.');
            toast({ title: 'AI Error', description: 'Audio threat detection failed.', variant: 'destructive' });
          }
        };
      };
      audioRecorder.start(5000); // Analyze every 5 seconds
      addLog('AI threat detection system is active.');
      
      addLog('Simulating evidence encryption...');
      addLog('Sending silent alert to emergency contacts...');

      // Mock sending POST request
      fetch('/api/alert', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          lat: location?.lat,
          lng: location?.lng,
          timestamp: new Date().toISOString(),
          user_id: 'anonymous',
          status: 'SOS_TRIGGERED',
        })
      }).catch(err => console.info('Mock API call.')); // This will fail but it's for demonstration

    } catch (err) {
      addLog('Failed to activate SOS.');
      toast({
        title: 'Permission Denied',
        description: 'Camera and microphone access is required to activate SOS.',
        variant: 'destructive',
      });
      cleanup();
    }
  }, [isSosActive, addLog, toast, cleanup, location?.lat, location?.lng, startWebRTCStream]);
  
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">SlideSafe Web</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`transition-colors ${isSosActive ? 'text-accent' : 'text-muted-foreground'}`} />
                  Emergency Control
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
                {!isSosActive ? (
                  <>
                    <SOSSlider onActivate={handleActivateSOS} />
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      In an emergency, slide the bar to the right to silently activate SOS. This will start recording evidence and alert your emergency contacts.
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full max-w-sm font-bold text-lg"
                      onClick={handleDeactivateSOS}
                    >
                      Deactivate SOS
                    </Button>
                    <p className="text-sm text-accent animate-pulse font-medium">
                      SOS MODE IS ACTIVE. Recording in progress.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Status Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full pr-4">
                  <div className="space-y-2 font-code text-sm">
                    {log.map((entry, i) => (
                      <p key={i} className="whitespace-pre-wrap">{entry}</p>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-sm aspect-video">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className={`transition-colors ${isSosActive ? 'text-accent' : 'text-muted-foreground'}`} />
                        Live Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-full">
                    <div className="w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} muted autoPlay playsInline className="w-full h-full object-cover"></video>
                        {!isSosActive && <p className="absolute text-muted-foreground text-sm">Feed is offline</p>}
                    </div>
                </CardContent>
            </Card>

            <StatusCard title="Geolocation" icon={<MapPin size={20} />}>
              {isSosActive && location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Inactive'}
            </StatusCard>

            <StatusCard title="Live Stream to Police" icon={<Radio size={20} />}>
              <div className={cn({
                  'text-green-500': streamStatus === 'Connected',
                  'text-yellow-500': ['Connecting', 'Checking'].includes(streamStatus),
                  'text-red-500': ['Failed', 'Disconnected', 'Closed'].includes(streamStatus),
              })}>
                  {streamStatus}
              </div>
            </StatusCard>

            <StatusCard title="AI Threat Analysis" icon={<Siren size={20} />}>
              {!isSosActive ? 'Offline' : !threatResult ? 'Listening...' : (
                <div className="flex items-center gap-2">
                  {threatResult.threatDetected ? 
                    <Badge variant="destructive" className="text-base">Threat</Badge> : 
                    <Badge variant="secondary" className="text-base bg-green-500 text-white">Clear</Badge>
                  }
                </div>
              )}
            </StatusCard>

            {threatResult && isSosActive && (
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-sm">
                  <p><strong>Keywords:</strong> {threatResult.threatKeywords.length > 0 ? threatResult.threatKeywords.join(', ') : 'None'}</p>
                  <p><strong>Confidence:</strong> {Math.round(threatResult.confidenceScore * 100)}%</p>
                </CardContent>
              </Card>
            )}

            <StatusCard title="Evidence" icon={<FileLock size={20} />}>
                {isSosActive ? 'Encrypting & Storing' : 'Secure'}
            </StatusCard>
          </div>
        </div>
      </div>
    </main>
  );
}
