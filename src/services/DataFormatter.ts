import constants from "../types/Constants";
import OpenAirInput from "../types/OpenAirInput";
import moment from 'moment';
import QBInvoiceOutput from "../types/QBInvoice";
import QBTimeOutput from "../types/QBTime";
import RateService from "./RateService";

const convertName = (name: string): string => {
    // Split the name into last name and first name
    const parts = name.split(', ');
    
    if (parts.length === 2) {
      const lastName = parts[0].split('-')[0]; // Extract the last name
      const firstName = parts[1]; // Extract the first name
  
      // Concatenate the first name and last name
      const convertedName = `${firstName} ${lastName}`;
  
      return convertedName;
    } else {
      // Return the original name if it doesn't match the expected format
      return name;
    }
  };
  
//   const convertDateFormat = (date: string): string => {
//     const convertedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
//     return convertedDate;
//   };

  const addSixDate = (date: string): string => {
    const endDate = moment(date).add(6, 'days').format('MM/DD/YYYY');
    return `${endDate}`;
  };

  const addThirtyDate = (date: string): string => {
    const dueDate = moment(date, 'MM/DD/YYYY').add(30, 'days').format('MM/DD/YYYY');
    return `${dueDate}`;
  };

  
const format = (data: OpenAirInput[], rateData: any, inputFormat: number, outputFormat: number, invoiceNo: string): any[] => {
    let formattedData: QBInvoiceOutput[] | QBTimeOutput[] = [];
    let tempArray: OpenAirInput[] = [];
    if (!data) {
        return formattedData;
    }

    let QBInvoice: QBInvoiceOutput = {
         Response: "",
    QbId: "",
    InvoiceNo: invoiceNo,
    Customer: "Kronos (UKG)",
    InvoiceDate: "",
    DueDate: "",
    ShipVia: "",
    ShippingDate: "",
    Trackingno: "",
    Terms: "Net 30",
    BillingAddressLine1: "1485 North Park Drive",
    BillingAddressLine2: "",
    BillingAddressLine3: "",
    BillingAddressCity: "Weston",
    BillingAddressPostalCode: "33326",
    BillingAddressCountry: "USA",
    BillingAddressState: "FL",
    ShippingAddressLine1: "",
    ShippingAddressLine2: "",
    ShippingAddressLine3: "",
    ShippingAddressCity: "",
    ShippingAddressPostalCode: "",
    ShippingAddressCountry: "",
    ShippingAddressState: "",
    Memo: "",
    Messagedisplayedoninvoice: "",
    Email: "needemail@email.com", 
    EmailCC: "",
    EmailBCC: "bccemail@email.com",
    Shipping: "",
    SalesTaxCode: "",
    SalesTaxAmount: "",
    DiscountAmount: "",
    DiscountPercent: "",
    DiscountAccount: "",
    DepositToAccount: "",
    Paymentmethod: "",
    PaymentReferenceNo: "",
    ApplyTaxAfterDiscount: "",
    ServiceDate: "",
    Service: "",
    ServiceDescription: "",
    ServiceQuantity: "",
    ServiceRate: "",
    ServiceAmount: "",
    ServiceTaxable: "",
    ServiceClass: "",
    Class: "",
    Deposit: "",
    Location: "",
    ShowSubTotal: "",
    CustomFieldValue1: "",
    CustomFieldValue2: "",
    CustomFieldValue3: "",
    CurrencyCode: "",
    ExchangeRate: "",
    PrintStatus: "",
    EmailStatus: "",
    EnableOnlinePayment: "",
    EnableIntuitPayment: "",
    EnableCreditCardPayment: "",
    EnableACHPayment: "",
    PaymentStatus: "",
    Balance: "",
    SalesTaxPercentage: "",
    };

    if(inputFormat === constants.OPENAIRINPUT) {
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
        data.forEach((row: OpenAirInput) => {
            let projectName = row["Project Name"];
            let beginDate = row["Week Begin Date"];
            let hours = parseFloat(row["Hours"]);
            let approved = row["Approval Status"];
            let name = convertName(row["Resource Name"]);
            if(!projectName || !beginDate || !hours || !approved || !name){
                throw new Error("Required data is missing, please check input file");
            } 
            const rowId = tempArray.findIndex(
             (proj: OpenAirInput) => proj["Project Name"] === projectName && 
                                    proj["Resource Name"] === name && 
                                    proj["Week Begin Date"] === beginDate
            );

            if(approved === "Approved") {
                const { billingRate/*, approver, approverEmail */ } =  RateService.findRateInfo(rateData, name, projectName);
                if(rowId === -1) {
                    
                    row["Resource Name"] = name;
                    row["Rate"] = billingRate;
                    tempArray.push(row);
                } else {
                    tempArray[rowId]["Hours"] = `${parseFloat(tempArray[rowId]["Hours"]) +  hours}`;
                    
                }
            }
             else {
                //some day in the future email approver
                // EmailService.email(approver, approverEmail);
             }
            
         });
        if(outputFormat === constants.QBINVOICEOUT) {
            let resourceName = tempArray[0]["Resource Name"];
            tempArray.forEach((row: OpenAirInput) => {
                let outputRow: QBInvoiceOutput = {...{}, ...QBInvoice};
                if(resourceName !== row["Resource Name"]) {
                    resourceName = row["Resource Name"];
                    let tempNo = parseInt(invoiceNo, 10);
                    tempNo++;
                    invoiceNo = `${tempNo}`;
                }

                const weekBeginDate = moment(row["Week Begin Date"]).format("MM/DD/YYYY");
                const weekEndDate = addSixDate(weekBeginDate);
                const today = moment().format("MM/DD/YYYY");
                let description = `UKG Consulting Services by: ${row["Resource Name"]} for ${weekBeginDate} - ${weekEndDate}`;
                
                
                const rate = row["Rate"];
                let serviceAmount = 0;
                if(rate && rate > 0) {
                    serviceAmount = parseFloat(row.Hours) * rate;
                }
                outputRow.InvoiceNo = invoiceNo;
                outputRow.InvoiceDate = today;
                outputRow.ServiceQuantity = row.Hours;
                outputRow.ServiceRate = `${rate}`;
                outputRow.ServiceAmount = `${serviceAmount}`;
                outputRow.Service = row["Project Name"];
                outputRow.ServiceDescription = description;         
                outputRow.DueDate = addThirtyDate(today);
                outputRow.ServiceTaxable = "False";

                formattedData.push(outputRow);
            });
        }
        if(outputFormat === constants.QBTIMEOUT){
            data.forEach((row)=>{
                console.log('row: ', row);
            });
        }
    }
    return formattedData;
};

const DataFormatterService = {
    format
  };
  
  export default DataFormatterService;