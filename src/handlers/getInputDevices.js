const getInputDevices = () => {
  return new Promise((pResolve, pReject) => {
    let videoInputDevices = [];
    let audioInputDevices = [];
    let audioOutputDevices = [];
    navigator?.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        for (let device of devices) {
          if (device.kind === 'videoinput') {
            videoInputDevices.push(device);
          } else if (device.kind === 'audioinput') {
            audioInputDevices.push(device);
          } else if (device.kind === 'audiooutput') {
            audioOutputDevices.push(device);
          }
        }
      })
      .then(() => {
        let data = { videoInputDevices, audioInputDevices, audioOutputDevices };
        pResolve(data);
      })
      .catch((e) => {
        pReject(e);
      });
  });
};

export { getInputDevices };
