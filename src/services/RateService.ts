import ConvertService from "../services/ConvertService";
import RateData from "../types/RateData";
import RateInfo from "../types/RateInfo";

const getRates = async (file: File, onConvert: any): Promise<any> => {
    let data;
    try {
        data = await ConvertService.convert(file, onConvert);
    } catch(err) {
        console.log('error converting rate file', err);
    }
    
    let rateData: any = {};

    data.forEach((row: RateData) => {
        const resourceName = row["Resource Name"];
        const projectName = row["Project Name"];
        const billingRate = parseFloat(row["Billing rate to UKG"]); //turn to number to do maths
        const approver = row["Approver"];
        const approverEmail = row["Approver Email"];

        if(!rateData[resourceName]) {
            rateData[resourceName] = {};
        }
        rateData[resourceName][projectName] = {billingRate, approver, approverEmail};
        return rateData;
    });

    return rateData;
};

const findRateInfo = (rateData: any, name: string, project: string): RateInfo => {
    return rateData[name][project];
}

const RateService = {
    getRates,
    findRateInfo
  };
  
  export default RateService;