import InvoiceGenerate from "./components/InvoiceGenerate";
import ReconcileTime from "./components/ReconcileTime";


import './App.css'


function App() { 
  
  return (
    <>
      <div>v1.35
      </div>
      <h1>Invoice Happy</h1>
      <div className="card">
        <InvoiceGenerate />
      </div>
      <div className="card">
        <ReconcileTime />
      </div>
    </>
  )
}

export default App
