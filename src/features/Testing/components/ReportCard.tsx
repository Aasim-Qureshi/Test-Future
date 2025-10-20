import { useState } from "react";
import { formatRelativeTime } from "../utils/dateUtils";

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

interface ReportCardProps {
    report: Report;
    isNewest: boolean;
}

function getReportStatus(report: Report): "green" | "yellow" | "orange" {
    const incompleteCount = report.asset_data.filter(a => a.submitState === 0).length;
    if (incompleteCount === 0) return "green";
    if (incompleteCount === report.asset_data.length) return "orange";
    return "yellow";
}

const ReportCard: React.FC<ReportCardProps> = ({ report, isNewest }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const completeCount = report.asset_data.filter(a => a.submitState === 1).length;
    const incompleteCount = report.asset_data.length - completeCount;
    const statusColor = getReportStatus(report);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div 
                className="flex flex-col p-6 cursor-pointer"
                onClick={toggleExpand}
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {report.report_id ? `Report ${report.report_id}` : report.title}
                        </h3>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
                                Total Assets: {report.asset_data.length}
                            </span>
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                                Incomplete: {incompleteCount}
                            </span>
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                                Complete: {completeCount}
                            </span>
                            {report.value && (
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                                    Value: {Number(report.value).toLocaleString()}
                                </span>
                            )}
                            
                            {/* New Badge */}
                            {isNewest && incompleteCount === report.asset_data.length && (
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-500 text-white shadow-sm">
                                    New
                                </span>
                            )}

                            {/* Status Badge */}
                            {!(isNewest && incompleteCount === report.asset_data.length) && (
                                <span
                                    className={`px-3 py-1 text-sm font-semibold rounded-full shadow-sm ${
                                        statusColor === "green"
                                            ? "bg-green-100 text-green-700"
                                            : statusColor === "yellow"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-orange-100 text-orange-700"
                                    }`}
                                >
                                    {statusColor === "green"
                                        ? "Complete"
                                        : statusColor === "yellow"
                                        ? "Partial"
                                        : "Pending"}
                                </span>
                            )}
                        </div>

                        {/* Timestamps */}
                        <div className="flex flex-wrap gap-2">
                            {report.startSubmitTime && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                    Started: {formatRelativeTime(report.startSubmitTime)}
                                </span>
                            )}
                            {report.endSubmitTime && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                                    Ended: {formatRelativeTime(report.endSubmitTime)}
                                </span>
                            )}
                            {report.createdAt && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                    Created: {formatRelativeTime(report.createdAt)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expand Indicator */}
                    <div className="flex-shrink-0">
                        <div className={`transform transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                        }`}>
                            <svg 
                                className="w-5 h-5 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Assets Details</h4>
                    <div className="grid gap-3">
                        {report.asset_data.map((asset) => (
                            <div 
                                key={asset._id} 
                                className="flex justify-between items-center p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{asset.asset_name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Type: {asset.asset_type} • Owner: {asset.owner_name}
                                    </p>
                                    <p className="text-sm font-semibold text-blue-600 mt-1">
                                        Value: {Number(asset.final_value).toLocaleString()}
                                    </p>
                                </div>
                                <span 
                                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                                        asset.submitState === 1
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : "bg-red-100 text-red-700 border border-red-200"
                                    }`}
                                >
                                    {asset.submitState === 1 ? "Complete" : "Incomplete"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCard;