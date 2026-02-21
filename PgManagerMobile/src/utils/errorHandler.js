export const getErrorMessage = (error) => {
    if (!error) return "An unknown error occurred.";

    // Network errors or no response
    if (!error.response) {
        return error.message || "Network error. Please check your connection to the server.";
    }

    const { data, status } = error.response;

    // 1. Custom API Error Format { success: false, message: "...", errors: [...] }
    if (data && data.message) {
        return data.message;
    }

    // 2. Validation Errors (ModelState) - returns object with field arrays
    // e.g. { "Name": ["Name is required"], "PhoneNumber": ["Invalid phone"] }
    if (status === 400 && data && typeof data === 'object') {
        // Build a list of validation messages
        const messages = [];
        Object.values(data).forEach(errorList => {
            if (Array.isArray(errorList)) {
                messages.push(...errorList);
            } else if (typeof errorList === 'string') {
                messages.push(errorList);
            }
        });

        if (messages.length > 0) {
            return messages[0]; // Return the first validation error
        }
    }

    // 3. ASP.NET Core Standard Problem Details
    if (data && data.title) {
        return data.title;
    }

    // Fallback based on status code
    if (status === 404) return "Resource not found.";
    if (status === 401) return "Unauthorized. Please login again.";
    if (status === 500) return "Internal server error. Please try again later.";

    return "Something went wrong. Please try again.";
};
