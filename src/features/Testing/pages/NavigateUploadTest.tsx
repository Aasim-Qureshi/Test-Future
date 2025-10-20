import { useEffect, useState } from "react";
import { getReportsData } from "../api";
import { useTaqeemAuth } from "../../../shared/context/TaqeemAuthContext";
import { useSocket } from "../../../shared/context/SocketContext";
import { useProgress } from "../../../shared/context/ProgressContext";
import { Play, Pause, RefreshCw } from "lucide-react";

interface Report {
    _id: string;
    title: string;
    report_id: string;
    asset_data: any[];
    value: string;
    createdAt?: string;
    owner_name: string;
    startSubmitTime?: string;
    endSubmitTime?: string;
}


const NavigateUploadTest: React.FC = () => {
    const { isLoggedIn: loggedIn } = useTaqeemAuth();
    const { socket, isConnected } = useSocket();
    const { progressStates, dispatch } = useProgress();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabsNum, setTabsNum] = useState(3);

    // Fetch reports
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data: Report[] = await getReportsData();
                const sortedReports = data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setReports(sortedReports);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleFormFillProgress = (data: any) => {
            console.log('[SOCKET] Progress update:', data);
            updateProgressFromSocket(data);
        };

        const handleFormFillComplete = (data: any) => {
            console.log('[SOCKET] Form fill complete:', data);
            handleCompletion(data.reportId);
        };

        const handleFormFillError = (data: any) => {
            console.error('[SOCKET] Form fill error:', data);
            handleError(data.reportId, data.error);
        };

        const handleFormFillPaused = (data: any) => {
            console.log('[SOCKET] Form fill paused:', data);
            updateProgress(data.reportId, { paused: true });
        };

        const handleFormFillResumed = (data: any) => {
            console.log('[SOCKET] Form fill resumed:', data);
            updateProgress(data.reportId, { paused: false });
        };

        // Register event listeners
        socket.on('form_fill_progress', handleFormFillProgress);
        socket.on('form_fill_complete', handleFormFillComplete);
        socket.on('form_fill_error', handleFormFillError);
        socket.on('form_fill_paused', handleFormFillPaused);
        socket.on('form_fill_resumed', handleFormFillResumed);

        // Cleanup
        return () => {
            socket.off('form_fill_progress', handleFormFillProgress);
            socket.off('form_fill_complete', handleFormFillComplete);
            socket.off('form_fill_error', handleFormFillError);
            socket.off('form_fill_paused', handleFormFillPaused);
            socket.off('form_fill_resumed', handleFormFillResumed);
        };
    }, [socket]);

    // Progress management functions
    const updateProgress = (reportId: string, updates: any) => {
        dispatch({
            type: 'UPDATE_PROGRESS',
            payload: { reportId, updates }
        });
    };

    const clearProgress = (reportId: string) => {
        dispatch({
            type: 'CLEAR_PROGRESS',
            payload: { reportId }
        });
    };

    const updateProgressFromSocket = (data: any) => {
        const { reportId, status, message, data: progressData } = data;

        let progress = 0;

        if (progressData?.percentage !== undefined) {
            progress = progressData.percentage;
        } else if (progressData?.current && progressData?.total) {
            progress = Math.round((progressData.current / progressData.total) * 100);
        } else {
            switch (status) {
                case 'INITIALIZING':
                case 'FETCHING_RECORD':
                    progress = 5;
                    break;
                case 'NAVIGATING':
                    progress = 10;
                    break;
                case 'STEP_STARTED':
                    if (progressData?.step && progressData?.total_steps) {
                        progress = Math.round((progressData.step / progressData.total_steps) * 60);
                    }
                    break;
                case 'STEP_COMPLETE':
                    if (progressData?.step && progressData?.total_steps) {
                        progress = Math.round(((progressData.step + 1) / progressData.total_steps) * 60);
                    }
                    break;
                case 'MACRO_PROCESSING':
                case 'MACRO_EDIT':
                case 'RETRY_PROGRESS':
                    progress = progressData?.percentage || 70;
                    break;
                case 'MACRO_COMPLETE':
                case 'MACRO_EDIT_COMPLETE':
                    progress = 85;
                    break;
                case 'CHECKING':
                case 'CHECK_STARTED':
                    progress = 90;
                    break;
                case 'RETRYING':
                case 'RETRY_STARTED':
                    progress = 50;
                    break;
                case 'RETRY_COMPLETE':
                case 'CHECK_COMPLETE':
                    progress = 95;
                    break;
                case 'COMPLETE':
                    progress = 100;
                    break;
                case 'REPORT_SAVED':
                    progress = 80;
                    break;
            }
        }

        updateProgress(reportId, {
            status,
            message,
            progress,
            data: progressData
        });
    };

    const handleCompletion = async (reportId: string) => {
        updateProgress(reportId, {
            progress: 100,
            message: 'Complete!',
            status: 'COMPLETE'
        });
        await new Promise(res => setTimeout(res, 2000));
        clearProgress(reportId);
        // Refresh reports to get updated status
        const data: Report[] = await getReportsData();
        setReports(data.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }));
    };

    const handleError = async (reportId: string, error: string) => {
        updateProgress(reportId, {
            message: `Error: ${error}`,
            progress: 0,
            status: 'FAILED'
        });
        await new Promise(res => setTimeout(res, 3000));
        clearProgress(reportId);
    };

    // Action handlers
    const handleSubmit = (reportId: string) => {
        if (!socket || !isConnected) {
            alert('Connection lost. Please refresh the page.');
            return;
        }

        socket.emit('join_ticket', `report_${reportId}`);
        socket.emit('start_form_fill', {
            reportId,
            tabsNum,
            userId: 'current_user',
            actionType: 'submit'
        });

        updateProgress(reportId, {
            status: 'INITIALIZING',
            progress: 0,
            message: 'Starting form submission...',
            paused: false,
            stopped: false,
            actionType: 'submit'
        });
    };

    const handlePause = (reportId: string) => {
        if (!socket || !isConnected) return;
        socket.emit('pause_form_fill', { reportId });
        updateProgress(reportId, { paused: true, message: 'Paused' });
    };

    const handleResume = (reportId: string) => {
        if (!socket || !isConnected) return;
        socket.emit('resume_form_fill', { reportId });
        updateProgress(reportId, { paused: false, message: 'Resumed' });
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const data: Report[] = await getReportsData();
            const sortedReports = data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setReports(sortedReports);
        } catch (error) {
            console.error("Failed to refresh reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get report display name
    const getReportDisplayName = (report: Report) => {
        return report.report_id || report.title || `Report ${report._id.slice(-6)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Navigate & Upload Test</h1>
                            <p className="text-gray-600 mt-1">Manage your report submissions</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="tabsNum" className="text-sm font-medium text-gray-700">
                                    Tabs:
                                </label>
                                <input
                                    id="tabsNum"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={tabsNum}
                                    onChange={(e) => setTabsNum(Number(e.target.value))}
                                    disabled={!loggedIn}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                    {reports.map((report) => {
                        const progressState = progressStates[report._id];
                        const isCompleted = report.endSubmitTime;
                        const canSubmit = loggedIn && !isCompleted && !progressState;

                        return (
                            <div
                                key={report._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6"
                            >
                                <div className="flex items-center justify-between">
                                    {/* Report Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {getReportDisplayName(report)}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <span>Assets: {report.asset_data.length}</span>
                                            <span>•</span>
                                            <span className={isCompleted ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                                                {isCompleted ? "Completed" : "Pending"}
                                            </span>
                                            {report.value && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium">
                                                        Value: {Number(report.value).toLocaleString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        {!progressState ? (
                                            <button
                                                onClick={() => handleSubmit(report._id)}
                                                disabled={!canSubmit}
                                                className={`px-6 py-2 rounded-lg font-semibold transition ${
                                                    canSubmit
                                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                }`}
                                            >
                                                Submit
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {!progressState.paused ? (
                                                    <button
                                                        onClick={() => handlePause(report._id)}
                                                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                                                        title="Pause"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleResume(report._id)}
                                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                                        title="Resume"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {progressState && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 font-medium">
                                                {progressState.paused ? "⏸ Paused: " : ""}
                                                {progressState.message}
                                            </span>
                                            <span className="text-gray-500 font-medium">
                                                {progressState.progress}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-2 transition-all duration-300 ${
                                                    progressState.status === 'COMPLETE'
                                                        ? 'bg-green-500'
                                                        : progressState.status === 'FAILED'
                                                        ? 'bg-red-500'
                                                        : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${progressState.progress}%` }}
                                            />
                                        </div>
                                        {progressState.data?.current !== undefined && progressState.data?.total !== undefined && (
                                            <div className="text-xs text-gray-500 text-right">
                                                {progressState.data.current} / {progressState.data.total} assets
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {reports.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                        <p className="text-gray-600">There are no reports to display at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavigateUploadTest;