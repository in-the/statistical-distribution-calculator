import Interactable from "components/Interactable";
import "css/App.css";
import { gamma } from "math/math";
import Ratio from "math/ratio";

/**
 * favicon taken from Google Material Symbols and Icons
 */
function App() {
  return (
    <div className="App">
      <h1>Statistical Distribution Calculator</h1>
      {gamma(Ratio.fromNumber(0.4)).toFixed(10)}
      <Interactable />
    </div>
  );
}

export default App;
