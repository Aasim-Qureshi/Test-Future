import React, { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { extractReportData } from "../api";
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  Save,
  ChevronRight,
  RefreshCw,
  FileText
} from "lucide-react";

const ExcelTest: React.FC = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState<
    'excel-upload' | 'excel-validation' | 'pdf-upload' | 'upload-to-db' | 'success'
  >('excel-upload');

  // Files & data
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelDataSheets, setExcelDataSheets] = useState<any[][][]>([]);
  
  // Validation state
  const [validationResults, setValidationResults] = useState({
    hasEmptyFields: false,
    hasFractionInFinalValue: false,
    hasInvalidPurposeId: false,
    hasInvalidValuePremiseId: false,
    totalErrors: 0
  });
  
  const [excelErrors, setExcelErrors] = useState<{ sheetIdx: number; row: number; col: number; message: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Allowed values
  const allowedPurposeIds = [1, 2, 5, 6, 8, 9, 10, 12, 14];
  const allowedValuePremiseIds = [1, 2, 3, 4, 5];

  // Step 1: Excel File Upload
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setExcelFile(files[0]);
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetsData: any[][][] = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: undefined });
          });
          setExcelDataSheets(sheetsData);
        } catch (err) {
          console.error(err);
          setError("Error reading Excel file. Please make sure the file is valid.");
        }
      };
      reader.readAsArrayBuffer(files[0]);
    }
  };

  // Step 2: Validate Excel File
  const handleValidateExcel = () => {
    if (!excelFile) return;
    
    setIsValidating(true);
    setTimeout(() => {
      const errors: { sheetIdx: number; row: number; col: number; message: string }[] = [];
      let hasEmptyFields = false;
      let hasFractionInFinalValue = false;
      let hasInvalidPurposeId = false;
      let hasInvalidValuePremiseId = false;

      excelDataSheets.forEach((sheet, sheetIdx) => {
        if (!sheet || sheet.length < 2) return;

        sheet.forEach((row, rowIdx) => {
          if (rowIdx === 0) return; // Skip header row

          row.forEach((cell, colIdx) => {
            const headerName = (sheet[0][colIdx] ?? "").toString().trim().toLowerCase();
            
            // Check empty fields
            if (cell === undefined || cell === "") {
              errors.push({
                sheetIdx,
                row: rowIdx,
                col: colIdx,
                message: "Empty field - please fill this field"
              });
              hasEmptyFields = true;
            }

            // Check final value fractions
            if (headerName === "final_value" && cell) {
              if (!Number.isInteger(Number(cell))) {
                errors.push({
                  sheetIdx,
                  row: rowIdx,
                  col: colIdx,
                  message: "Final value must be an integer"
                });
                hasFractionInFinalValue = true;
              }
            }

            // Check purpose IDs
            if (headerName === "purpose_id" && cell) {
              if (!allowedPurposeIds.includes(Number(cell))) {
                errors.push({
                  sheetIdx,
                  row: rowIdx,
                  col: colIdx,
                  message: `Invalid purpose ID - Allowed: ${allowedPurposeIds.join(", ")}`
                });
                hasInvalidPurposeId = true;
              }
            }

            // Check value premise IDs
            if (headerName === "value_premise_id" && cell) {
              if (!allowedValuePremiseIds.includes(Number(cell))) {
                errors.push({
                  sheetIdx,
                  row: rowIdx,
                  col: colIdx,
                  message: `Invalid value premise - Allowed: ${allowedValuePremiseIds.join(", ")}`
                });
                hasInvalidValuePremiseId = true;
              }
            }
          });
        });
      });

      setExcelErrors(errors);
      setValidationResults({
        hasEmptyFields,
        hasFractionInFinalValue,
        hasInvalidPurposeId,
        hasInvalidValuePremiseId,
        totalErrors: errors.length
      });
      setIsValidating(false);

      // Move to next step if validation passed
      if (errors.length === 0) {
        setCurrentStep('pdf-upload');
      }
    }, 1500);
  };

  // Step 3: PDF Upload
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setPdfFile(files[0]);
      // Move to final step when PDF is uploaded
      setCurrentStep('upload-to-db');
    }
  };

  // Step 4: Upload to DB
  const handleUploadToDB = async () => {
    if (!excelFile || !pdfFile) return;
    
    try {
      setIsUploading(true);
      const response: any = await extractReportData(excelFile, [pdfFile]);
      console.log("Upload Response:", response);
      
      if (response?.status === "FAILED" && response.error) {
        setError(response.error);
        return;
      }
      
      if (response?.status === "SAVED" || response?.status === "SUCCESS") {
        setCurrentStep('success');
      }

    } catch (error) {
      console.error("Error:", error);
      setError("Error saving report. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Download corrected file
  const downloadCorrectedExcel = () => {
    if (!excelDataSheets.length) return;

    const workbook = XLSX.utils.book_new();
    
    excelDataSheets.forEach((sheet, sheetIdx) => {
      if (!sheet || sheet.length === 0) return;

      const newSheetData = sheet.map((r) => (Array.isArray(r) ? [...r] : r));
      const errorsForThisSheet = excelErrors.filter((e) => e.sheetIdx === sheetIdx);

      errorsForThisSheet.forEach((err) => {
        const r = err.row;
        const c = err.col;
        if (!newSheetData[r]) newSheetData[r] = [];
        const oldVal = newSheetData[r][c] === undefined || newSheetData[r][c] === null ? "" : newSheetData[r][c];
        newSheetData[r][c] = `${oldVal} ⚠ ${err.message}`;
      });

      const ws = XLSX.utils.aoa_to_sheet(newSheetData);
      XLSX.utils.book_append_sheet(workbook, ws, `Sheet${sheetIdx + 1}`);
    });

    XLSX.writeFile(workbook, "corrected_file.xlsx", { bookType: "xlsx" });
  };

  const isExcelValid = excelErrors.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 Excel File Test</h1>
          <p className="text-gray-600">Sequential testing process for Excel reports</p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {[
              { step: 'excel-upload', label: 'Excel Upload', icon: Upload },
              { step: 'excel-validation', label: 'Excel Validation', icon: FileCheck },
              { step: 'pdf-upload', label: 'PDF Upload', icon: FileText },
              { step: 'upload-to-db', label: 'Upload to DB', icon: Save },
              { step: 'success', label: 'Success', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }, index, array) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : currentStep > step
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      currentStep === step || currentStep > step 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                    }`}>
                      {label}
                    </div>
                  </div>
                </div>
                {index < array.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Step 1: Excel Upload */}
          {currentStep === 'excel-upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Excel File</h2>
                <p className="text-gray-600">Start by uploading your Excel file</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-700 mb-2">Excel File</h3>
                <p className="text-sm text-gray-500 mb-4">Upload Excel file with report data</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {excelFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                    <span className="text-green-700 text-sm">{excelFile.name}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentStep('excel-validation')}
                  disabled={!excelFile}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto ${
                    excelFile
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Validate Excel File
                  <FileCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Excel Validation */}
{/* Step 2: Excel Validation */}
{currentStep === 'excel-validation' && (
  <div className="space-y-6">
    <div className="text-center">
      <FileCheck className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Validate Excel File</h2>
      <p className="text-gray-600">Check your Excel file for errors before proceeding</p>
    </div>

    {excelFile && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium text-blue-800">Current file</p>
            <p className="text-sm text-blue-600">{excelFile.name}</p>
          </div>
        </div>
      </div>
    )}

    {/* Show validation button only when not validating and no results yet */}
    {!isValidating && excelErrors.length === 0 && (
      <div className="text-center">
        <button
          onClick={handleValidateExcel}
          disabled={!excelFile}
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors"
        >
          <FileCheck className="w-4 h-4" />
          Start Validation
        </button>
      </div>
    )}

    {isValidating && (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Validating Excel file...</p>
        </div>
      </div>
    )}

    {/* Validation Results - Only show after validation completes */}
    {!isValidating && excelErrors.length > 0 && (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800">Validation Failed</h3>
          </div>
          <p className="text-red-700 mb-3">Found {excelErrors.length} errors in your Excel file.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className={`p-3 rounded-lg border-2 text-center ${
              validationResults.hasEmptyFields ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="font-medium text-sm mb-1">Empty Fields</div>
              {validationResults.hasEmptyFields ? (
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
              )}
            </div>

            <div className={`p-3 rounded-lg border-2 text-center ${
              validationResults.hasFractionInFinalValue ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="font-medium text-sm mb-1">Fractions</div>
              {validationResults.hasFractionInFinalValue ? (
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
              )}
            </div>

            <div className={`p-3 rounded-lg border-2 text-center ${
              validationResults.hasInvalidPurposeId ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="font-medium text-sm mb-1">Purpose IDs</div>
              {validationResults.hasInvalidPurposeId ? (
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
              )}
            </div>

            <div className={`p-3 rounded-lg border-2 text-center ${
              validationResults.hasInvalidValuePremiseId ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="font-medium text-sm mb-1">Value Premise</div>
              {validationResults.hasInvalidValuePremiseId ? (
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={downloadCorrectedExcel}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Corrected File
            </button>
            
<button
  onClick={() => {
    // Reset validation state when going back to upload
    setExcelErrors([]);
    setValidationResults({
      hasEmptyFields: false,
      hasFractionInFinalValue: false,
      hasInvalidPurposeId: false,
      hasInvalidValuePremiseId: false,
      totalErrors: 0
    });
    setCurrentStep('excel-upload');
  }}
  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
>
  <Upload className="w-4 h-4" />
  Upload New Excel File
</button>
          </div>
        </div>
      </div>
    )}

    {/* Success State - Only show after successful validation */}
    {!isValidating && isExcelValid && excelErrors.length === 0 && validationResults.totalErrors === 0 && (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-green-800">Validation Successful</p>
              <p className="text-green-700">No errors found in your Excel file</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentStep('pdf-upload')}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors"
          >
            Continue to PDF Upload
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}
  </div>
)}
          {/* Step 3: PDF Upload */}
          {currentStep === 'pdf-upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload PDF File</h2>
                <p className="text-gray-600">Upload the PDF report file to complete the process</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-700 mb-2">PDF File</h3>
                <p className="text-sm text-gray-500 mb-4">Upload PDF report file</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {pdfFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                    <span className="text-green-700 text-sm">{pdfFile.name}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep('excel-validation')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Validation
                </button>

                <button
                  onClick={() => setCurrentStep('upload-to-db')}
                  disabled={!pdfFile}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                    pdfFile
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue to Upload
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Upload to DB */}
          {currentStep === 'upload-to-db' && (
            <div className="space-y-6">
              <div className="text-center">
                <Save className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload to Database</h2>
                <p className="text-gray-600">Complete the process by uploading both files to the database</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Excel File:</span>
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {excelFile?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">PDF File:</span>
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {pdfFile?.name}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('pdf-upload')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to PDF Upload
                </button>

                <button
                  onClick={handleUploadToDB}
                  disabled={!excelFile || !pdfFile || isUploading}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                    excelFile && pdfFile && !isUploading
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Upload To DB
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Success!</h2>
                <p className="text-gray-600">Your report has been saved successfully</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <h3 className="text-xl font-semibold text-green-800 mb-2">Process Completed</h3>
                <p className="text-green-600 mb-4">The report has been successfully processed and saved in the system.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setCurrentStep('excel-upload');
                      setExcelFile(null);
                      setPdfFile(null);
                      setExcelDataSheets([]);
                      setExcelErrors([]);
                      setError("");
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Start New Test
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelTest;