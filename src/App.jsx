import FrameAnimationPreviewer from "./components/FrameAnimationPreviewer";
import SpritesheetSlicer from "./components/SpritesheetSlicer";

function App(){

  return (
    <div id="app" className="App w-screen min-h-screen bg-lighter">
      <FrameAnimationPreviewer />
      {/* <SpritesheetSlicer /> */}
    </div>
  )
}

export default App;
