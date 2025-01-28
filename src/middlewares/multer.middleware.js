import multer from "multer";

//local file upload function

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/temp");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//export

export const uploadFile = multer({ storage });
