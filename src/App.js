import BinomialCalculator from "components/BinomialCalculator";
import "css/App.css";
import { Binomial } from "math/distribution";
import Ratio from "math/ratio";

function App() {
  return (
    <div className="App">
      <h1>Statistical Distribution Calculator</h1>
      <BinomialCalculator />
    </div>
  );
}

export default App;
