console.log("test");

export {};
// const signaling = new SignalingChannel();
// const constraints = {audio: true, video: true};
// const configuration = {iceServers: [{urls: 'stuns:stun.example.org'}]};
// const pc = new RTCPeerConnection(configuration);

// // Send any ice candidates to the other peer.
// pc.onicecandidate = ({candidate}) => signaling.send({candidate});

// // Let the "negotiationneeded" event trigger offer generation.
// pc.onnegotiationneeded = async () => {
//   try {
//     await pc.setLocalDescription(await pc.createOffer());
//     // Send the offer to the other peer.
//     signaling.send({desc: pc.localDescription});
//   } catch (err) {
//     console.error(err);
//   }
// };

// // Once remote track media arrives, show it in remote video element.
// pc.ontrack = (event) => {
//   // Don't set srcObject again if it is already set.
//   if (remoteView.srcObject) return;
//   remoteView.srcObject = event.streams[0];
// };

// // Call start() to initiate.
// async function start() {
//   try {
//     // Get local stream, show it in self-view, and add it to be sent.
//     const stream =
//       await navigator.mediaDevices.getUserMedia(constraints);
//     stream.getTracks().forEach((track) =>
//       pc.addTrack(track, stream));
//     selfView.srcObject = stream;
//   } catch (err) {
//     console.error(err);
//   }
// }

// signaling.onmessage = async ({desc, candidate}) => {
//   try {
//     if (desc) {
//       // If you get an offer, you need to reply with an answer.
//       if (desc.type === 'offer') {
//         await pc.setRemoteDescription(desc);
//         const stream =
//           await navigator.mediaDevices.getUserMedia(constraints);
//         stream.getTracks().forEach((track) =>
//           pc.addTrack(track, stream));
//         await pc.setLocalDescription(await pc.createAnswer());
//         signaling.send({desc: pc.localDescription});
//       } else if (desc.type === 'answer') {
//         await pc.setRemoteDescription(desc);
//       } else {
//         console.log('Unsupported SDP type.');
//       }
//     } else if (candidate) {
//       await pc.addIceCandidate(candidate);
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };

// pc.ondatachannel = (event) => {
//   receiveChannel = event.channel;
//   receiveChannel.onmessage = onReceiveMessage;
//   receiveChannel.onopen = onReceiveChannelStateChange;
//   receiveChannel.onclose = onReceiveChannelStateChange;
// };