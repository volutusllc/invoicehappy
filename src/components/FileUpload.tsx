import moment from 'moment';
import { useState } from "react";
import IFile from "../types/File";
import constants from "../types/Constants";
import ConvertService from "../services/ConvertService";
import DataFormatterService from "../services/DataFormatter";
import RateService from "../services/RateService";


function FileUpload () {
    const [currentTimeFile, setCurrentTimeFile] = useState<File>();
    const [currentPayFile, setCurrentPayFile] = useState<File>();
    const [currentInvoiceNo, setCurrentInvoiceNo] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [message, setMessage] = useState<string>("");
    const [inputFormat, setInputFormat] = useState<number>(1);
    const [outputFormat, setOutputFormat] = useState<number>(2);
    const [fileInfos, setFileInfos] = useState<Array<IFile>>([]);

   
      const selectInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
          setInputFormat(parseInt(event.target.value, 10));
      };
      const selectOutputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
          setOutputFormat(parseInt(event.target.value, 10));
      };

      const handleInvoiceNoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentInvoiceNo(event.target.value);
      }
    
      const selectTimeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setCurrentTimeFile(selectedFiles?.[0]);
        setProgress(0);
      };

      const selectPayFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setCurrentPayFile(selectedFiles?.[0]);
    };

    const removeFileExtension = (filename: string): string => {
      const lastDotIndex = filename.lastIndexOf('.');
      if (lastDotIndex === -1) {
        return filename; // No file extension found
      }
      return filename.substring(0, lastDotIndex);
    }
    
      const convert = () => {
        setProgress(0);
        if (!currentTimeFile || !currentPayFile) {
          setMessage("Both Rate file and Time file need to be selected!");
          return;
        }
        
        let files: IFile[] = [];
        let rateData = {};
        
        //process resource/project rates file
        RateService.getRates(currentPayFile, () => {
            console.log('rate file uploaded');
        })
        .then((data) => {            
            rateData = data;
        });

        // process time data file
        ConvertService.convert(currentTimeFile, (event: any) => {
          setProgress(Math.round((100 * event.loaded) / event.total));
        })
          .then((data) => {
            files.push({url: currentTimeFile, name: currentTimeFile.name});
            const outputData = DataFormatterService.format(data, rateData, inputFormat, outputFormat, currentInvoiceNo);
            setMessage("Successfully uploaded");
            return ConvertService.getFile(outputData);
          })
          .then((file: string) => {
            const fileName = `${removeFileExtension(currentTimeFile.name)}-converted-${moment().format("MM/DD/YYYY")}.csv`;
            const fileBlob = new Blob([file], { type: 'text/csv;charset=utf-8;' });
            // if (navigator.msSaveBlob) { // In case of IE 10+
            //     navigator.msSaveBlob(fileBlob, fileName);
            // } else {
            files.push({url: fileBlob, name: fileName});
            setFileInfos(files);
            
            return fileBlob;
            // }
          })
          .catch((err) => {
            setProgress(0);
            console.log("convert file error: ", err);
            if (err.response && err.response.data && err.response.data.message) {
              setMessage(err.response.data.message);
            } else {
              setMessage("Could not convert the File!");
            }
    
            setCurrentTimeFile(undefined);
          });
      };
    
return (
    <div>
      <div className="row">
      <div className="col-8">
          <label className="btn btn-default p-0">
            Next Invoice Number: 
          </label>
          <input type='text' value={currentInvoiceNo} onChange={handleInvoiceNoChange}/>
        </div>
        <div className="col-8">
          <label className="btn btn-default p-0">
            Time Sheet File: <input type="file" onChange={selectTimeFile} />
          </label>
        </div>
        <div className="col-8">
          <label className="btn btn-default p-0">
            Pay Rates File: <input type="file" onChange={selectPayFile} />
          </label>
        </div>

        <div className="col-4">
          <div >
            <label>Select Input Format</label>
            <select onChange={selectInputChange} defaultValue={1} className="form-select">
                <option  value={constants.OPENAIRINPUT}>Open Air Input</option>
            </select>
            </div>
            <div>
            <label>Select Output Format</label>
            <select onChange={selectOutputChange} defaultValue={2} className="form-select">
                <option  value={constants.QBINVOICEOUT}>QuickBooks Invoice</option>
                <option value={constants.QBTIMEOUT}>QuickBooks Time</option>
            </select>
            </div>    
          <button
            className="btn btn-success btn-sm"
            disabled={!currentTimeFile}
            onClick={convert}
          >
            Convert
          </button>
        </div>
      </div>

      {currentTimeFile && (
        <div className="progress my-3">
          <div
            className="progress-bar progress-bar-info"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: progress + "%" }}
          >
            {progress}%
          </div>
        </div>
      )}

      {message && (
        <div className="alert alert-secondary mt-3" role="alert">
          {message}
        </div>
      )}

      <div className="card mt-3">
        <div className="card-header">List of Files</div>
        <ul className="list-group list-group-flush">
          {fileInfos &&
            fileInfos.map((file, index) => (
              <li className="list-group-item" key={index}>
                <a href={URL.createObjectURL(file.url)} download={file.name}>Download {file.name}</a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

// if (navigator.msSaveBlob) { // In case of IE 10+
//     navigator.msSaveBlob(blob, filename);
// } else {
//     const link = document.createElement('a');
//     if (link.download !== undefined) {
//         // Browsers that support HTML5 download attribute
//         const url = URL.createObjectURL(blob);
//         link.setAttribute('href', url);
//         link.setAttribute('download', filename);
//         link.style.visibility = 'hidden';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     }
// }
export default FileUpload;