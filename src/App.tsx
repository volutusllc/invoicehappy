import { useState } from 'react'
import FileUpload from "./components/FileUpload";


import './App.css'


function App() {
  const [file, setFile] = useState();
  
  
  return (
    <>
      <div>
      </div>
      <h1>Invoice Happy</h1>
      <div className="card">
      <FileUpload />
      </div>
    </>
  )
}

export default App
