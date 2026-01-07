
function ProgressBar({current, max, className}: {current: number, max: number, className?: string}) {
    current = current%max;
    const progressBarWidth = Math.ceil((current/max)*100)%100;

    return (
        <div className={`progress-bar ${className || ""}`}>
            <div className="progress" style={{
                width: `${progressBarWidth}%`,
                maxWidth: '100%'
            }}></div>
        </div>
    )
}

export default ProgressBar