import moment from 'moment';
import { useState } from "react";
import IFile from "../types/File";
import ConvertService from "../services/ConvertService";
import InvoiceService from '../services/InvoiceService';
import TimeService from '../services/TimeService';
import ReconcileService from '../services/ReconcileService';
import Reconciled from '../types/Reconciled';


function ReconcileTime () {
    const [currentSummaryFile, setSummaryTimeFile] = useState<File>();
    const [currentTimeFile, setCurrentTimeFile] = useState<File>();
    const [currentInvoiceFile, setInvoiceFile] = useState<File>();
    
    const [progress, setProgress] = useState<number>(0);
    const [message, setMessage] = useState<string>("");
    const [fileInfos, setFileInfos] = useState<Array<IFile>>([]);

    const selectSummaryFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setSummaryTimeFile(selectedFiles?.[0]);
        setProgress(0);
      };
    
      const selectTimeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setCurrentTimeFile(selectedFiles?.[0]);
        setProgress(0);
      };

    const selectInvoiceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        const selectedFiles = files as FileList;
        setInvoiceFile(selectedFiles?.[0]);
    };

    const removeFileExtension = (filename: string): string => {
      const lastDotIndex = filename.lastIndexOf('.');
      if (lastDotIndex === -1) {
        return filename; // No file extension found
      }
      return filename.substring(0, lastDotIndex);
    }
    
      const convert = async () => {
        setProgress(0);
        if (!currentSummaryFile || !currentTimeFile || !currentInvoiceFile) {
          setMessage("Both Rate file and Time file need to be selected!");
          return;
        }
        
        let files: IFile[] = [];
        
        try {
        //process resource/project rates file
        let summaryData = await TimeService.getTime(currentSummaryFile, () => {
            console.log('summary file uploaded');
        });
        let timeData = await TimeService.getTime(currentTimeFile, () => {
            console.log('time file uploaded');
        });
        let invoiceData = await InvoiceService.getInvoices(currentInvoiceFile, () => {
            console.log('invoice file uploaded');
        });

        // process time data file
        
            files.push({url: currentSummaryFile, name: currentTimeFile.name});
            files.push({url: currentTimeFile, name: currentTimeFile.name});
            files.push({url: currentInvoiceFile, name: currentInvoiceFile.name});
            const outputData: Reconciled[] = ReconcileService.reconcile(summaryData, timeData, invoiceData);
            setMessage("Successfully processed");
            let outputFile = ConvertService.getFile(outputData);
          
          
            const fileName = `hours-reconciled-${moment().format("MM/DD/YYYY")}.csv`;
            const fileBlob = new Blob([outputFile], { type: 'text/csv;charset=utf-8;' });
            // if (navigator.msSaveBlob) { // In case of IE 10+
            //     navigator.msSaveBlob(fileBlob, fileName);
            // } else {
            files.push({url: fileBlob, name: fileName});
            setFileInfos(files);
            
            return fileBlob;
            // }
        
    } catch (err: any) {
            setProgress(0);
            console.log("convert file error: ", err);
            if (err.response && err.response.data && err.response.data.message) {
              setMessage(err.response.data.message);
            } else {
              setMessage("Could not convert the File!");
            }
    
            setSummaryTimeFile(undefined);
          }
      };
    
return (
    <div>
        <div className="row">
            <div className="col-8"><h2>Reconcile Time</h2></div>
        </div>
      <div className="row">
        <div className="col-8">
          <label className="btn btn-default p-0">
            OA Summary File: <input type="file" onChange={selectSummaryFile} />
          </label>
        </div>
        <div className="col-8">
          <label className="btn btn-default p-0">
            OA Time Sheet File: <input type="file" onChange={selectTimeFile} />
          </label>
        </div>
        <div className="col-8">
          <label className="btn btn-default p-0">
            QB Invoice File: <input type="file" onChange={selectInvoiceFile} />
          </label>
        </div>

        <div className="col-4">
          
          <button
            className="btn btn-success btn-sm"
            disabled={!currentSummaryFile}
            onClick={convert}
          >
            Convert
          </button>
        </div>
      </div>

      {currentSummaryFile && (
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
export default ReconcileTime;