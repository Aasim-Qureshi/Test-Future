import { useEffect, useState } from "react";
import { getReportsData } from "../api";
import { RefreshCcw, CheckCircle, Pause, Play } from "lucide-react";
import LoginModal from "../components/EquipmentTaqeemLogin";
import { useTaqeemAuth } from "../../../shared/context/TaqeemAuthContext";
import { useSocket } from "../../../shared/context/SocketContext";
import { useSocketManager } from "../../../shared/hooks/useSocketManager";
import { useProgress } from "../../../shared/context/ProgressContext";

interface Asset {
    _id: string;
    final_value: string;
    asset_name: string;
    asset_type: string;
    owner_name: string;
    submitState: number;
}

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.floor(
        (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const timeString = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    if (diffDays === 0) return `Today, ${timeString}`;
    if (diffDays === 1) return `Yesterday, ${timeString}`;
    return `${diffDays} days ago, ${timeString}`;
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

interface ProgressData {
    step?: number;
    total_steps?: number;
    total?: number;
    current?: number;
    percentage?: number;
    macro_id?: number;
    form_id?: string;
    error?: string;
}

interface ProgressState {
    status: string;
    message: string;
    progress: number;
    paused: boolean;
    stopped: boolean;
    actionType?: "submit" | "retry" | "check";
    data?: ProgressData;
}

const ViewEquipmentReports: React.FC = () => {
    const { isLoggedIn: loggedIn } = useTaqeemAuth();
    const { socket, isConnected } = useSocket(); // Use socket from context
    const [reports, setReports] = useState<Report[]>([]);
    const [openReports, setOpenReports] = useState<Record<string, boolean>>({});
    const [showLoginModal, setShowLoginModal] = useState(false);
    // const [progressStates, setProgressStates] = useState<Record<string, ProgressState>>({});
    const [newestReportId, setNewestReportId] = useState<string | null>(null);
    const [tabsNum, setTabsNum] = useState(3);
    const { progressStates, dispatch } = useProgress();
    const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

    useSocketManager();

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

        const handleFormFillStopped = (data: any) => {
            console.log('[SOCKET] Form fill stopped:', data);
            clearProgress(data.reportId);
        };

        // Register event listeners
        socket.on('form_fill_progress', handleFormFillProgress);
        socket.on('form_fill_complete', handleFormFillComplete);
        socket.on('form_fill_error', handleFormFillError);
        socket.on('form_fill_paused', handleFormFillPaused);
        socket.on('form_fill_resumed', handleFormFillResumed);
        socket.on('form_fill_stopped', handleFormFillStopped);

        // Cleanup: remove listeners when component unmounts
        return () => {
            socket.off('form_fill_progress', handleFormFillProgress);
            socket.off('form_fill_complete', handleFormFillComplete);
            socket.off('form_fill_error', handleFormFillError);
            socket.off('form_fill_paused', handleFormFillPaused);
            socket.off('form_fill_resumed', handleFormFillResumed);
            socket.off('form_fill_stopped', handleFormFillStopped);
        };
    }, [socket]);

    function getReportStatus(report: Report): "green" | "yellow" | "orange" {
        const incompleteCount = report.asset_data.filter(a => a.submitState === 0).length;
        if (incompleteCount === 0) return "green";
        if (incompleteCount === report.asset_data.length) return "orange";
        return "yellow";
    }

    async function fetchReports() {
        const data: Report[] = await getReportsData();
        const sortedReports = data.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        setNewestReportId(sortedReports[0]?._id || null);
        setReports(sortedReports);
    }

    useEffect(() => {
        fetchReports();
    }, []);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const updateProgress = (reportId: string, updates: Partial<ProgressState>) => {
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

        // Calculate progress based on status and data
        if (progressData?.percentage !== undefined) {
            progress = progressData.percentage;
        } else if (progressData?.current && progressData?.total) {
            progress = Math.round((progressData.current / progressData.total) * 100);
        } else {
            // Estimate progress based on status
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
        await delay(2000);
        clearProgress(reportId);
        fetchReports();
    };

    const handleError = async (reportId: string, error: string) => {
        updateProgress(reportId, {
            message: `Error: ${error}`,
            progress: 0,
            status: 'FAILED'
        });
        await delay(3000);
        clearProgress(reportId);
    };

    const handleSubmit = (reportId: string) => {
        if (!socket || !isConnected) {
            console.error('[SOCKET] Socket not connected');
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

        // Initialize progress state in global context
        updateProgress(reportId, {
            status: 'INITIALIZING',
            progress: 0,
            message: 'Starting form submission...',
            paused: false,
            stopped: false,
            actionType: 'submit'
        });
    };

    const handleRetry = (reportId: string) => {
        if (!socket || !isConnected) {
            console.error('[SOCKET] Socket not connected');
            alert('Connection lost. Please refresh the page.');
            return;
        }

        socket.emit('join_ticket', `report_${reportId}`);
        socket.emit('start_form_fill', {
            reportId,
            tabsNum,
            userId: 'current_user',
            actionType: 'retry'
        });

        updateProgress(reportId, {
            status: 'INITIALIZING',
            progress: 0,
            message: 'Starting retry for incomplete macros...',
            paused: false,
            stopped: false,
            actionType: 'retry'
        });
    };

    const handleCheck = (reportId: string) => {
        if (!socket || !isConnected) {
            console.error('[SOCKET] Socket not connected');
            alert('Connection lost. Please refresh the page.');
            return;
        }

        socket.emit('join_ticket', `report_${reportId}`);
        socket.emit('start_form_fill', {
            reportId,
            tabsNum,
            userId: 'current_user',
            actionType: 'check'
        });

        updateProgress(reportId, {
            status: 'INITIALIZING',
            progress: 0,
            message: 'Checking asset statuses...',
            paused: false,
            stopped: false,
            actionType: 'check'
        });
    };

    const handlePause = async (reportId: string) => {
        if (!socket || !isConnected) return;
        socket.emit('pause_form_fill', { reportId });
        updateProgress(reportId, { paused: true, message: 'Paused' });
    };

    const handleResume = async (reportId: string) => {
        if (!socket || !isConnected) return;
        socket.emit('resume_form_fill', { reportId });
        updateProgress(reportId, { paused: false, message: 'Resumed' });
    };

    const toggleDropdown = (reportId: string) => {
        setOpenReports(prev => ({ ...prev, [reportId]: !prev[reportId] }));
        setDropdownOpen(prev => ({ ...prev, [reportId]: !prev[reportId] }));
    };

    // Check if controls should be shown (not during checking phase)
    const shouldShowControls = (state: ProgressState) => {
        const checkingStatuses = ['CHECKING', 'CHECK_STARTED', 'CHECK_COMPLETE'];
        return !checkingStatuses.includes(state.status) && state.actionType !== "check";
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">View Reports</h2>
                {!loggedIn && (
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                        Login
                    </button>
                )}
            </div>

            {reports.map(report => {
                const completeCount = report.asset_data.filter(a => a.submitState === 1).length;
                const incompleteCount = report.asset_data.length - completeCount;
                const progressState = progressStates[report._id];
                const statusColor = getReportStatus(report);

                return (
                    <div
                        key={report._id}
                        className="relative bg-white shadow-sm rounded-xl border border-gray-200 hover:shadow-md transition"
                    >
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleDropdown(report._id)}>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Report {report.report_id ? report.report_id : report.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                            Total Assets: {report.asset_data.length}
                                        </span>
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                            Incomplete: {incompleteCount}
                                        </span>
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                            Complete: {completeCount}
                                        </span>
                                        {report.value && (
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                Final Value: {Number(report.value).toLocaleString()}
                                            </span>
                                        )}


                                        {/* 👇 Add start/end submit time capsules here */}

                                        {report._id === newestReportId && incompleteCount === report.asset_data.length && (
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white shadow-sm">
                                                New
                                            </span>
                                        )}

                                        {!(report._id === newestReportId && incompleteCount === report.asset_data.length) && (
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${statusColor === "green"
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
                                    <div className="mt-3 gap-2 flex flex-wrap">
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
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={tabsNum}
                                        onChange={(e) => setTabsNum(Number(e.target.value))}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={!loggedIn}
                                        className="w-16 px-2 py-1 border rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        title="Number of tabs"
                                    />

                                    <button
                                        onClick={e => { e.stopPropagation(); handleSubmit(report._id); }}
                                        disabled={!loggedIn || !!report.endSubmitTime || !!progressState}
                                        className={`px-4 py-2 font-semibold rounded-lg transition ${(!loggedIn || !!report.endSubmitTime || !!progressState)
                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-400 text-white hover:bg-blue-500'
                                            }`}
                                    >
                                        Submit
                                    </button>

                                    <button
                                        onClick={e => { e.stopPropagation(); handleRetry(report._id); }}
                                        disabled={!loggedIn || !report.endSubmitTime || incompleteCount === 0 || !!progressState}
                                        className={`p-2 rounded-lg transition ${(!loggedIn || !report.endSubmitTime || incompleteCount === 0 || !!progressState)
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-400 text-white hover:bg-blue-500"
                                            }`}
                                        title="Retry"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={e => { e.stopPropagation(); handleCheck(report._id); }}
                                        disabled={!loggedIn || !report.endSubmitTime || !!progressState}
                                        className={`p-2 rounded-lg transition ${(!loggedIn || !report.endSubmitTime || !!progressState)
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-300 hover:bg-green-400'
                                            }`}
                                        title="Check Assets"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>

                                    {progressState && shouldShowControls(progressState) && (
                                        <div className="flex gap-1">
                                            {!progressState.paused ? (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handlePause(report._id); }}
                                                    className="p-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 transition"
                                                    title="Pause"
                                                >
                                                    <Pause className="w-4 h-4 text-white" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleResume(report._id); }}
                                                    className="p-2 rounded-lg bg-green-400 hover:bg-green-500 transition"
                                                    title="Resume"
                                                >
                                                    <Play className="w-4 h-4 text-white" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {progressState && (
                                <div className="px-4 pb-3 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-2 transition-all duration-300 ${progressState.status === 'COMPLETE'
                                                    ? 'bg-green-500'
                                                    : progressState.status === 'FAILED'
                                                        ? 'bg-red-500'
                                                        : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${progressState.progress}%` }}
                                            />
                                        </div>
                                        {!progressState.paused && progressState.status !== 'COMPLETE' && progressState.status !== 'FAILED' && (
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">
                                            {progressState.paused ? "⏸ Paused: " : ""}
                                            {progressState.message}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {progressState.progress}%
                                        </span>
                                    </div>
                                    {progressState.data?.current !== undefined && progressState.data?.total !== undefined && (
                                        <div className="text-xs text-gray-500">
                                            {progressState.data.current} / {progressState.data.total}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {openReports[report._id] && (
                            <div className="px-4 pb-4 space-y-3">
                                {report.asset_data.map(asset => (
                                    <div key={asset._id} className="flex justify-between items-center rounded-lg p-3 border border-gray-100 bg-gray-50 transition">
                                        <div>
                                            <p className="font-medium text-gray-800">{asset.asset_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {asset.final_value} • {report.owner_name}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${asset.submitState === 1
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}>
                                            {asset.submitState === 1 ? "Complete" : "Incomplete"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {showLoginModal && (
                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            )}
        </div>
    );
};

export default ViewEquipmentReports;