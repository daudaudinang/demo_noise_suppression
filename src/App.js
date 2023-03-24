import logo from './logo.svg';
import './App.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ButtonGroup from './components/ButtonGroup';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getInputDevices } from './handlers';
import Selector from './components/Selector';
import { NoiseSuppressionProcessor } from "@shiguredo/noise-suppression";

const assetsPath = "https://cdn.jsdelivr.net/npm/@shiguredo/noise-suppression@latest/dist";
const processor = new NoiseSuppressionProcessor(assetsPath);

const ModeList = [
  {
    label: 'Mặc định',
    value: 'default',
  },
  {
    label: 'Mặc định + rnnoise',
    value: 'rnnoise-default',
  },
  {
    label: 'Tối ưu',
    value: 'optimize'
  },
  {
    label: 'Tối ưu + rnnoise',
    value: 'rnnoise-optimize'
  }
]

function App() {
  const [originalStream, setOriginalStream] = useState();
  const [processedStream, setProcessedStream] = useState();
  const [processedStream2, setProcessedStream2] = useState();
  const [optimizeMode, setOptimizeMode] = useState('default');
  const [listDevices, setListDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('default');
  const ref = useRef();

  const getStream = useCallback(() => {
    console.log(navigator.mediaDevices.getSupportedConstraints());
    navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedDevice || undefined,
        sampleRate: {ideal: 48000},
        sampleSize: {ideal: 480},
        channelCount: 1
      },
      video: false,
    }).then(stream => {
      console.log("stream: ", stream);
      setOriginalStream(stream);
    })
  }, [selectedDevice]);

  useEffect(() => {
    getInputDevices()
    .then(data => {
        setListDevices(data.audioInputDevices.map((one) => ({
          label: one.label || 'no permission',
          value: one.deviceId || '',
        }))
      )
    })
  }, [originalStream]);

  useEffect(() => {
    if(listDevices?.length && !selectedDevice) {
      setSelectedDevice(listDevices[0])
    }
  }, [listDevices, selectedDevice]);

  useEffect(() => {
    if(optimizeMode?.includes('optimize') && processedStream) {
      const context = new AudioContext();
      const processedTrack = processedStream.getAudioTracks()[0];

      if(!processedTrack) return;
      const gainNode = context.createGain();

      const noiseGate = context.createDynamicsCompressor();
      noiseGate.threshold.value = -30;
      noiseGate.ratio.value = 100;
      noiseGate.attack.value = 0.05;
      noiseGate.release.value = 0.5;
  
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -20.2; // Best: -20.2
      compressor.knee.value = 8; // Best: 8
      compressor.ratio.value = 11; // Best: 11
      compressor.attack.value = 3; // Best: 3
      compressor.release.value = 0.1; // Best: 0.1
  
      const highPassFilter = context.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 100;
  
      const lowPassFilter = context.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 4000;

      const destination = context.createMediaStreamDestination();

      gainNode.gain.value = 1;
  
      const input = context.createMediaStreamSource(new MediaStream([processedTrack]));
  
      input.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(noiseGate);
      noiseGate.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(destination);
  
      const audioTracks = destination.stream.getAudioTracks();
      if (audioTracks?.length > 0) {
        const processedTrack = audioTracks[0];
        setProcessedStream2(new MediaStream([processedTrack]));
      }
    } else if(processedStream) {
      setProcessedStream2(processedStream);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedStream, optimizeMode]);

  useEffect(() => {
    if(ref && ref?.current && originalStream) {
      if(!optimizeMode?.includes('rnnoise')) {
        setProcessedStream(originalStream);
      } else {
        const originalTrack = originalStream.getAudioTracks()[0];
        processor.startProcessing(originalTrack).then(track => {
          setProcessedStream(new MediaStream([track]));
        });
      }
    }
  }, [originalStream, optimizeMode, selectedDevice]);

  useEffect(() => {
    if(processedStream2) {
      ref.current.srcObject = processedStream2;
    }
  }, [processedStream2]);

  const changeSelectedDevice = useCallback((value) => {
    setSelectedDevice(value);
  }, []);

  const clear = useCallback(() => {
    processor.stopProcessing();

    originalStream?.getTracks()?.forEach(track => {
      track.stop();
    });
    processedStream?.getTracks()?.forEach(track => {
      track.stop();
    });
    processedStream2?.getTracks()?.forEach(track => {
      track.stop();
    });

    setOriginalStream(undefined);
    setProcessedStream(undefined);
    setProcessedStream2(undefined);
  }, [originalStream, processedStream, processedStream2]);

  const start = useCallback(() => {
    clear();
    getStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getStream, clear]);

  const changeMode = useCallback((value) => {
    setOptimizeMode(value);
    if(originalStream) {
      start();
    }
  }, [originalStream, start]);

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
      <ButtonGroup list={ModeList} value={optimizeMode} onChange={changeMode} />
      <Selector list={listDevices} onChange={changeSelectedDevice} defaultValue={selectedDevice}/>
      <Button type="primary" shape="round" icon={<DownloadOutlined />} size={20} style={{margin: "16px 0"}} onClick={start}>
        Bắt đầu
      </Button>
      <audio ref={ref} autoPlay={true} muted={false} controls></audio>
    </div>
  );
}

export default App;
