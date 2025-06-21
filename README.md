# SlideSafe Web: Intelligent Emergency Response

SlideSafe Web is a proof-of-concept emergency reporting application designed to provide a discreet and powerful way to request help in critical situations. Our core idea is to transform a standard web browser into an intelligent safety tool that can not only alert authorities but also analyze the user's environment for threats in real-time.

## Key Features

*   **Silent SOS Activation:** A simple, discreet slider allows users to activate an emergency alert without drawing attention.
*   **AI-Powered Threat Detection:** The application listens to the user's microphone, using advanced AI to analyze the audio stream for keywords and sounds that may indicate a threat (e.g., "help," "gunshot," breaking glass).
*   **Real-time Evidence Gathering:** Upon activation, the app immediately begins recording video and audio, continuously tracks the user's location, and maintains a detailed status log of all actions.
*   **Simulated Emergency Dispatch:** When a threat is detected by the AI, the system automatically sends a high-priority alert, including the user's location, threat details, and the complete event log, to a simulated emergency services endpoint.
*   **Live WebRTC Streaming:** The application initiates a live video and audio stream, demonstrating how first responders could get real-time visual context of the situation.

## Future Development

This project showcases the powerful front-end capabilities of a modern safety application. The next phase of development will focus on building out the backend infrastructure, including:

*   A robust signaling server to establish and manage WebRTC connections with emergency dispatch centers.
*   Secure endpoints to receive, process, and store evidence and alert data.
*   Integration with actual emergency services and contact management systems.

<a href="https://studio.firebase.google.com/import?url=https%3A%2F%2Fgithub.com%2Fthejas-dev%2Fvibe-sos">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.firebasestudio.dev/btn/continue_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.firebasestudio.dev/btn/continue_light_32.svg">
    <img
      height="32"
      alt="Continue in Firebase Studio"
      src="https://cdn.firebasestudio.dev/btn/continue_blue_32.svg">
  </picture>
</a>
