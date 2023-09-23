import ConvertService from "../services/ConvertService";
import TimeData from "../types/OpenAirInput";


const getTime = async (file: File, onConvert: any): Promise<any> => {
    let data: TimeData;
    try {
        data = await ConvertService.convert(file, onConvert);
        return data;
    } catch(err) {
        console.log('error converting time file', err);
    }
};


const TimeService = {
    getTime
  };
  
export default TimeService;