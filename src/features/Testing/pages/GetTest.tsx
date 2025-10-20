import { useState } from "react";
import { getReportsData } from "../api";
import ReportCard from "../components/ReportCard";
import { RefreshCw } from "lucide-react";

interface Asset {
    _id: string;
    final_value: string;
    asset_name: string;
    asset_type: string;
    owner_name: string;
    submitState: number;
}

interface Report {
    _id: string;
    title: string;
    asset_data: Asset[];
    value: string;
    createdAt?: string;
    owner_name: string;
    report_id: string;
    startSubmitTime?: string;
    endSubmitTime?: string;
}

const GetTest: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetAllReports = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const data: Report[] = await getReportsData();
            const sortedReports = data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setReports(sortedReports);
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError("Failed to fetch reports. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 Get Test - Reports</h1>
                    <p className="text-gray-600">Fetch and display all equipment reports</p>
                </div>

                {/* Control Panel */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Reports Management</h2>
                            <p className="text-sm text-gray-600">
                                {reports.length > 0 
                                    ? `Loaded ${reports.length} report${reports.length !== 1 ? 's' : ''}` 
                                    : 'No reports loaded yet'}
                            </p>
                        </div>
                        
                        <button
                            onClick={handleGetAllReports}
                            disabled={isLoading}
                            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                                isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Get All Reports
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">!</span>
                                </div>
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reports Grid */}
                {reports.length > 0 ? (
                    <div className="space-y-6">
                        {reports.map((report) => (
                            <ReportCard 
                                key={report._id} 
                                report={report} 
                                isNewest={report._id === reports[0]?._id}
                            />
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reports Loaded</h3>
                            <p className="text-gray-500">Click "Get All Reports" to fetch and display your reports</p>
                        </div>
                    )
                )}

                {isLoading && reports.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Loading Reports</h3>
                        <p className="text-gray-500">Fetching your reports from the server...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GetTest;