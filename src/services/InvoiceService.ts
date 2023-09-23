import ConvertService from "./ConvertService";
import QBInvoiceOutput from "../types/QBInvoiceOutput";


const getInvoices = async (file: File, onConvert: any): Promise<any> => {
    let data: QBInvoiceOutput;
    try {
        data = await ConvertService.convert(file, onConvert);
        return data;
    } catch(err) {
        console.log('error converting invoice file', err);
    }
};


const InvoiceService = {
    getInvoices
  };
  
export default InvoiceService;