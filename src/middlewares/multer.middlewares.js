import multer from "multer";

/**
 * Multer storage configuration.
 * This setup defines how incoming files are stored on the server's local disk
 * before being uploaded to a cloud service like Cloudinary.
 */
const storage = multer.diskStorage({
	/**
	 * Specifies the destination directory for temporary file storage.
	 * All uploaded files will be saved in the './public/temp' directory.
	 *
	 * @param {Object} req - The Express request object.
	 * @param {Object} file - The file object being uploaded.
	 * @param {Function} cb - The callback function to signal completion.
	 */
	destination: function (req, file, cb) {
		cb(null, "/tmp");
	},

	/**
	 * Defines the filename for the stored file.
	 * To prevent naming conflicts, a unique suffix (timestamp + random number)
	 * is appended to the original field name.
	 *
	 * @param {Object} req - The Express request object.
	 * @param {Object} file - The file object being uploaded.
	 * @param {Function} cb - The callback function to signal completion.
	 */
	filename: function (req, file, cb) {
		// Note: A more robust implementation might sanitize file.originalname
		// instead of using file.fieldname to preserve the file extension.
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + "-" + uniqueSuffix);
	},
});

/**
 * The configured Multer middleware instance.
 * This can be used in routes to handle various file upload scenarios
 * (e.g., `upload.single('avatar')`, `upload.fields([...])`).
 */
export const upload = multer({
	storage: storage,
});
