import Papa from "papaparse";

const convert = (file: File, onUploadProgress: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    onUploadProgress({loaded: 100, total: 100})
                    if (results.errors.length > 0) {
                        console.log('rejected');
                        reject(results.errors);
                    }
                    resolve(results.data);
                }
            });
        }
        catch (err: any) {
            reject(err);
        }
    });
};

const getFile = (fileData: object[]): string => {
    const newFile = Papa.unparse(fileData);
    return newFile;
}

const ConvertService = {
  convert,
  getFile
};

export default ConvertService;