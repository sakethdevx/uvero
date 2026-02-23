/**
 * Progress Bar component with percentage display
 */
export default function ProgressBar({ progress, label = '' }) {
    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-semibold text-primary-600">{Math.round(progress)}%</span>
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        </div>
    );
}
