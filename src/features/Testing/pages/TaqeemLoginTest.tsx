import { useState } from "react";
import { taqeemLogin } from "../api";
import { useTaqeemAuth } from "../../../shared/context/TaqeemAuthContext";

interface TaqeemLoginTestProps {
    setIsLoggedIn?: (loggedIn: boolean) => void;
}

export default function TaqeemLoginTest({ setIsLoggedIn: setLoggedInProp }: TaqeemLoginTestProps) {
    const { setIsLoggedIn } = useTaqeemAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpRequired, setOtpRequired] = useState(false);
    const [otp, setOtp] = useState("");
    const [progressMessage, setProgressMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!otpRequired) {
                setProgressMessage("🔑 Entering Email and Password...");
            } else {
                setProgressMessage("📲 Verifying OTP...");
            }

            const response = await taqeemLogin(email, password, otpRequired ? otp : undefined);
            console.log(response);

            if (response.status === "NOT_FOUND") {
                setProgressMessage("❌ User not found. Please try again.");
            } else if (response.status === "OTP_REQUIRED") {
                setOtpRequired(true);
                setProgressMessage("✅ Email and Password accepted. Please enter OTP.");
            } else if (response.status === "OTP_FAILED") {
                setProgressMessage("❌ OTP failed. Please try again.");
            } else if (response.status === "SUCCESS") {
                setIsLoggedIn(true);
                if (setLoggedInProp) setLoggedInProp(true);
                setProgressMessage("🎉 Login successful!");
                // Reset form on success
                resetForm();
            } else if (response.status === "FAILED") {
                resetForm();
                setProgressMessage("❌ Login failed. Please try again.");
                alert("Login failed. Please try again.");
            } else {
                setProgressMessage("❌ Login failed");
                alert("Login failed");
            }
        } catch (error) {
            console.error(error);
            setProgressMessage("⚠️ Something went wrong");
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setOtp("");
        setOtpRequired(false);
    };

    const handleBackToEmail = () => {
        setOtpRequired(false);
        setOtp("");
        setProgressMessage("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {otpRequired ? "Verify Your Identity" : "Welcome Back"}
                    </h1>
                    <p className="text-gray-600">
                        {otpRequired ? "Enter the OTP sent to your device" : "Sign in to your Taqeem account"}
                    </p>
                </div>

                {/* Progress Message */}
                {progressMessage && (
                    <div className={`mb-6 p-4 rounded-lg text-center text-sm font-medium ${
                        progressMessage.includes("❌") || progressMessage.includes("⚠️") 
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : progressMessage.includes("🎉")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                        {progressMessage}
                    </div>
                )}

                {/* Login Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {otpRequired ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Enter 6-digit code"
                                    required
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={handleBackToEmail}
                                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                    disabled={loading}
                                >
                                    ← Back to email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="text"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between">
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {otpRequired ? "Verifying..." : "Signing in..."}
                            </>
                        ) : (
                            otpRequired ? "Verify OTP" : "Sign In"
                        )}
                    </button>
                </form>

                {/* Footer */}

                {/* Security Note */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Your data is securely encrypted and protected
                    </p>
                </div>
            </div>
        </div>
    );
}