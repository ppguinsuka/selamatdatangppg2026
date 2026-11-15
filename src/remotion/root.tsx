import {Composition} from 'remotion';
import {Bumper} from './Bumper';
import {DURATION,FPS,HEIGHT,WIDTH,DEFAULT_PROPS} from '../data/project';
export const RemotionRoot=()=> <Composition id="PPG2026" component={Bumper}
    durationInFrames={DURATION*FPS} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={DEFAULT_PROPS}/>;
