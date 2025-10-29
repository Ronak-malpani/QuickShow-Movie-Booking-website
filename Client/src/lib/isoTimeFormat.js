// This is the updated code for lib/isoTimeFormat.js

const isoTimeFormat = (isoString) => {
    
    try {
        const date = new Date(isoString);

        if (isNaN(date.getTime())) {
            console.error("isoTimeFormat failed to parse:", isoString); // Keep this error log too
            return "Invalid Time";
        }

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
    } catch (error) {
        console.error("Unexpected error in isoTimeFormat:", error, "Input:", isoString);
        return "Invalid Time";
    }
};

export default isoTimeFormat;