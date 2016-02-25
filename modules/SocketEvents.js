var Events = {
	Input: {
		REQUEST_ASSESSMENTS: "ra",
		LOGIN: "l",
    REGISTER: "r",
    UPDATE_VALUES: "uv"
	},
	Output: {
		LOGIN_SUCCEEDED: "ls",
    REGISTRATION_SUCCEEDED: "rs",
    ERROR: "err",
    UPDATED_VALUES: "uv",
    ALL_TASKS: "at"
	}
};

module.exports = Events;
