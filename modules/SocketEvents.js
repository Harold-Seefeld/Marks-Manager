var Events = {
	Input: {
		REQUEST_TABLE: "rt",
		LOGIN: "log",
    REGISTER: "reg",
    UPDATE_VALUES: "uv"
	},
	Output: {
		REQUEST_TABLE: "rt",
    NEW_TABLE: "nt",
		NEW_TABLE_ENTRY: "ne",
    LOGIN_SUCCEEDED: "ls",
    REGISTRATION_SUCCEEDED: "rs",
    ERROR: "err",
    UPDATED_VALUES: "uv",
    ALL_SUBJECTS: "as"
	}
};

module.exports = Events;
