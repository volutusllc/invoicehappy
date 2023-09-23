import moment from "moment";
import OpenAirInput from "../types/OpenAirInput";
import QBInvoiceInput from "../types/QBInvoiceInput";
import Reconciled from "../types/Reconciled";
import DataFormatter from "./DataFormatter"

const reconcile = (summaryData: OpenAirInput[], timeData: OpenAirInput[], invoiceData: QBInvoiceInput[]): Reconciled[] => {
    const data: Reconciled[] = [];
    if (!summaryData || !timeData || !invoiceData) {
        return data;
    }

    let processedSummaryData: any[] = processOAFile(summaryData);
    let processedTimeData: any [] = processOAFile(timeData);
    let processedInvoiceData: any [] = processInvoiceFile(invoiceData);
  
    //combine two OA datasets to one object
    let unmatchedInvoices: Reconciled[] = [];
    let reconciledData: Reconciled[] = [];
    processedSummaryData.forEach((summaryRecon: any) => {
        const timeRowId = processedTimeData.findIndex(
            (timeRecon: any) => timeRecon.projectName === summaryRecon.projectName && 
                                   timeRecon.name === summaryRecon.name && 
                                   timeRecon.beginDate === summaryRecon.beginDate);
        
        let { "Approved": sumAccHours, "Rejected": sumRejHours, "Submitted": sumSubHours, "Open": sumOpenHours} = summaryRecon.hours;
        let projSplit: any[] = summaryRecon.projectName.split("-");
        let tempReconciled: Reconciled = {
            "Resource Name": summaryRecon.name,
            "Project Name": projSplit[1].trim(),
            "Project Number": projSplit[0].trim(),
            "Week Start Date": moment(summaryRecon.beginDate).format("MM/DD/YYYY")
        }
        tempReconciled["Summary Accepted Hours"] = sumAccHours;
        tempReconciled["Summary Rejected Hours"] = sumRejHours;
        tempReconciled["Summary Submitted Hours"] = sumSubHours;
        tempReconciled["Summary Open Hours"] = sumOpenHours;

        let { "Approved": timeAccHours, "Rejected": timeRejHours, "Submitted": timeSubHours, "Open": timeOpenHours, "Negative": negHours  } = processedTimeData[timeRowId].hours;
        tempReconciled["Time Accepted Hours"] = timeAccHours;
        tempReconciled["Time Open Hours"] = timeOpenHours;
        tempReconciled["Time Rejected Hours"] = timeRejHours;
        tempReconciled["Time Submitted Hours"] = timeSubHours;
        tempReconciled["Negative Accepted Hours"] = negHours;
        
        const invRowId = processedInvoiceData.findIndex(
            (invRecon: any) => 
            {   
                //console.log(tempReconciled["Week Start Date"], invRecon.periodStartDate, invRecon.periodEndDate, moment(tempReconciled["Week Start Date"]).isBetween(invRecon.periodStartDate, invRecon.periodEndDate, 'day', '[]'));   
                return (invRecon["Resource"] === tempReconciled["Resource Name"] && 
                    invRecon["Project Number"] === tempReconciled["Project Number"] && 
                    moment(tempReconciled["Week Start Date"]).isBetween(invRecon.periodStartDate, invRecon.periodEndDate, 'day', '[]') ) ;
            });

        if(invRowId > 0) {
            tempReconciled["Invoice Number"] = processedInvoiceData[invRowId]["Invoice Number"];
            tempReconciled["Invoiced Hours"] = processedInvoiceData[invRowId]["Hours"];
            tempReconciled["Payment Status"] = processedInvoiceData[invRowId]["Payment Status"];
            tempReconciled["Invoiced Difference"] = (processedInvoiceData[invRowId]["Hours"] - sumAccHours);
            tempReconciled["Voided?"] = processedInvoiceData[invRowId]["Voided?"];
            processedInvoiceData[invRowId].matched = true;
            
        } else {
            
            tempReconciled["Invoice Number"] = "";
            tempReconciled["Invoiced Hours"] = 0;
            tempReconciled["Payment Status"] = "";
            tempReconciled["Invoiced Difference"] = (0 - sumAccHours);
            tempReconciled["Voided?"] = "";            
        }
        
        reconciledData.push(tempReconciled);
    });
    
    
    processedInvoiceData.forEach((invoice: any) => {
        if(invoice.matched === false) {
            let unmatched: Reconciled = {
                "Resource Name": invoice["Resource"],
                "Project Name": `UNMATCHED - ${invoice["Project Name"]}`,
                "Project Number": invoice["Project Number"],
                "Week Start Date": invoice.periodStartDate,
                "Time Accepted Hours": 0,
                "Negative Accepted Hours": 0,
                "Summary Accepted Hours": 0,
                "Time Submitted Hours": 0,
                "Summary Submitted Hours": 0,
                "Time Rejected Hours": 0,
                "Summary Rejected Hours": 0,
                "Time Open Hours": 0,
                "Summary Open Hours": 0,
                "Invoice Number": invoice["Invoice Number"],
                "Invoiced Hours": invoice["Hours"],
                "Payment Status": invoice["Payment Status"],
                "Voided?": invoice["Voided?"],
                "Invoiced Difference": 0
            };
            unmatchedInvoices.push(unmatched);
        }
        
    });
    let finalData = [...reconciledData, ...unmatchedInvoices];
    finalData = summaryRow(finalData);
    return finalData;
};

const summaryRow = (data: Reconciled[]): Reconciled[] => {
    let SAhours: number = 0;
    let SRhours: number = 0
    let SShours:number = 0;
    let SOhours:number = 0; 
    let TAhours:number = 0; 
    let TOhours:number = 0; 
    let TRhours:number = 0; 
    let TShours:number = 0;
    let NegAhours:number = 0;
    let Inhours:number = 0;
    let IDiffHours:number = 0;
    let voided:number = 0;
    data.forEach((row: Reconciled) => {
        SAhours += row["Summary Accepted Hours"];            
        SRhours += row["Summary Rejected Hours"];
        SShours += row["Summary Submitted Hours"];
        SOhours += row["Summary Open Hours"];

        TAhours += row["Time Accepted Hours"];
        TOhours += row["Time Open Hours"];
        TRhours += row["Time Rejected Hours"];
        TShours += row["Time Submitted Hours"];
        
        NegAhours += row["Negative Accepted Hours"];
        Inhours += row["Invoiced Hours"];
        IDiffHours += row["Invoiced Difference"];

        if(row["Voided?"]) {
            voided++;
        }
          
    });
    let reconciledSummaryRow: Reconciled = {
        "Resource Name": "Summary Row",
        "Week Start Date": "N/A",
        "Project Name": "N/A",
        "Project Number": "N/A",       
        "Summary Accepted Hours": SAhours,
        "Summary Rejected Hours": SRhours,
        "Summary Submitted Hours": SShours,
        "Summary Open Hours": SOhours,
        "Time Accepted Hours": TAhours,
        "Time Open Hours": TOhours,
        "Time Rejected Hours": TRhours,
        "Time Submitted Hours": TShours,
        "Negative Accepted Hours": NegAhours,
        "Invoiced Hours": Inhours,
        "Invoice Number": "N/A",
        "Payment Status": "N/A",
        "Voided?": `${voided}`,
        "Invoiced Difference": IDiffHours
    };


    let tempArray: Reconciled[] = [reconciledSummaryRow, ...data];
   
    return tempArray;
}; 

const processInvoiceFile = (data: QBInvoiceInput[]): any[] => {
    let previousInv: any = {};
    let parsedInvoices: QBInvoiceInput[] = [];
    data.forEach((invoice: QBInvoiceInput)=> {
        let tempInv: any = {};
        tempInv["Invoice Number"] = invoice["Invoice No"];
        tempInv["Service Date"] = moment(invoice["Service Date"]).format('MM/DD/YYYY');
        tempInv["Payment Status"] = invoice["Payment Status"];
        tempInv["Hours"] = invoice["Product/Service Quantity"];
        tempInv["Voided?"] = invoice.Memo==="Voided" ? true:false;
        
        if(invoice["Product/Service"] && invoice["Product/Service Description"]) {
            previousInv = parseInvoiceDesc(invoice["Product/Service"], invoice["Product/Service Description"], tempInv["Service Date"], previousInv)
        } else {
            console.log('Required service and service description invoice data missing');
            return [];
        }
        
       
        tempInv["Project Number"] = previousInv.projectNo;
        tempInv["Project Name"] = previousInv.projectName;
        tempInv["Resource"] = previousInv.resource;
        tempInv.periodStartDate = previousInv.periodStartDate;
        tempInv.periodEndDate = previousInv.periodEndDate;
        tempInv.matched = false;
        parsedInvoices.push(tempInv);
        
    });

    return parsedInvoices;
};

const parseInvoiceDesc = (service: string, serviceDesc: string, endDate: string, previousInv: any): any => {
    let resource = "";
    let projectName = "";
    let projectNo = "";
    let periodStartDate;
    let periodEndDate;
    let splitDesc = serviceDesc.split(" ");
    let serviceSplit = service.split(" ");
    
    if(serviceSplit[0] === "Professional") {
        //pre invoice happy data
        //parse description
        
        
        if(splitDesc[0] === "Same" || splitDesc.findIndex((idx) => idx==="Same") > -1) {
            // description is "Same as", replace
            //console.log("replacing with previous: ", previousInv);
            return previousInv;
        } else {
            //loop through array to look for start of project name
            let pIdx: number = -1;
            splitDesc.forEach((str: string, idx: number) => {
                if(str.includes("\n")) {
                    pIdx = idx;
                }
            });
            if(pIdx > 0) {
                let splitName = splitDesc[pIdx].split("\n");
                resource = splitDesc[pIdx-1] + " " + splitName[0];
                projectName = splitName[1] + " " + splitDesc[pIdx+1];
            } else {
                resource = splitDesc[4] + " " + splitDesc[5];
                projectName = splitDesc[6] + " " + splitDesc[7];
            }

            if(resource.includes(':')){
                resource = resource.split(':')[1];
            }

            //normalizing name data
            resource = resource.replace("Chris ", "Christopher ");
            resource = resource.replace(" Eves", " Evers");
            resource = resource.replace(" Martines", " Martinez");
            resource = resource.replace(" Madella", " Maddela");
            resource = resource.trim();
            
            let idx = splitDesc.findIndex((inv: any) => inv[0] === '#');
            if(idx < 0) {
                console.log("PROJECT NUM MISSING", splitDesc);
                return previousInv;
            }
            let length = splitDesc.length;
            let dates = splitDesc[length-1];
            if(!dates.startsWith('#')) {
                //if starts with #, dates are missing in description use service date
                let splitDates = dates.split('-');
                
                let endDate = moment(splitDates[1],'MM/DD/YYYY');
                
                if(endDate.isValid()) {
                    let begin = splitDates[0] + '/' + moment(endDate).year();                    
                    let beginDate = moment(begin).format("MM/DD/YYYY");

                    periodEndDate = endDate.format("MM/DD/YYYY");
                    periodStartDate = beginDate;
                } else {                    
                    if(splitDesc[length-2]+splitDesc[length-1] === "March,2023") {
                        periodEndDate = moment("3/31/2023").format("MM/DD/YYYY");
                        periodStartDate = moment("3/1/2023").format("MM/DD/YYYY");
                    } else if (splitDesc[length-2]+splitDesc[length-1] === "February,2023") {
                        periodEndDate = moment("2/28/2023").format("MM/DD/YYYY");
                        periodStartDate = moment("2/1/2023").format("MM/DD/YYYY");
                    } else {
                        periodEndDate = "";
                        periodStartDate = "";
                    }
                }
            }

            projectNo = splitDesc[idx]; 
        }
    } else {
        // invoice happy data
        projectNo = serviceSplit[0];
        resource = splitDesc[7] + " " + splitDesc[8];
        projectName = `${serviceSplit[2]} ${serviceSplit[3]} ${serviceSplit[4]}`;
    }

    //remove hash from front of project number
    if(projectNo && projectNo.substring(0,1) === '#') {
        projectNo = projectNo.substring(1);
    }
    if(!periodStartDate || !periodEndDate) {
        if(endDate) {
            periodEndDate = endDate;
            periodStartDate = moment(endDate).subtract(6, 'days').format("MM/DD/YYYY");
        } else {
            console.log("Missing dates: ", service, serviceDesc);
        }    
    }
    
    return {resource, projectName, projectNo, periodStartDate, periodEndDate};
    
};

const processOAFile = (data: OpenAirInput[]): any[] => {
    let sortedData: OpenAirInput[] = sortOpenAir(data);
    let tempArray: any[] = [];
    
    sortedData.forEach((row: OpenAirInput) => {
        let projectName = row["Project Name"];
        let beginDate = row["Week Begin Date"];
        let hours = parseFloat(row["Hours"]);
        let status = row["Approval Status"];
        let name = DataFormatter.convertName(row["Resource Name"]);
        let tempRecon: any = {
            name,
            projectName,
            beginDate,
            hours: {"Approved": 0, "Rejected": 0, "Open": 0, "Submitted": 0, "Negative": 0}
        };
        if(!projectName || !beginDate || isNaN(hours) || !status || !name){
            //throw new Error("Required data is missing, please check input file");
            return false;
        } 
        const rowId = tempArray.findIndex(
         (recon: any) => recon.projectName === projectName && 
                                recon.name === name && 
                                recon.beginDate === beginDate
        );

        if(rowId === -1) {
            if(hours < 0) {
                tempRecon["hours"]["Negative"] = hours;
            } else {
                tempRecon["hours"][status] = hours;
            }
            
            tempArray.push(tempRecon);
        } else {
            if(hours < 0) {
                tempArray[rowId]["hours"]["Negative"] = tempArray[rowId]["hours"]["Negative"] + hours; // negative number
            } else {
                tempArray[rowId]["hours"][status] = tempArray[rowId]["hours"][status] +  hours;
            }
        }
     });
    return tempArray;
};

const sortOpenAir = (data: OpenAirInput[]): OpenAirInput[] => {
    data.sort((a: OpenAirInput, b: OpenAirInput) => {
        const nameA = a["Resource Name"].toUpperCase();
        const nameB = b["Resource Name"].toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
      
        // names must be equal
        return 0;
    });
    return data;
};
const ReconcileService = {
    reconcile
  };
  
export default ReconcileService;
