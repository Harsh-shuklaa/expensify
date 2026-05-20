import axiosInstance from './axiosInstance';
import { API_PATHS } from './apiPaths';

const uploadImage = async (imageFile) => {
    const formData = new FormData();
    // Append the image file to the form data with the key 'profileImage'
    formData.append('profileImage', imageFile);

    try {
        const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData,{
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading the image:', error);
        throw error;
    }
};

export default uploadImage;


//utils/uploadImage.js


// import axiosInstance from './axiosInstance';
// import { API_PATHS } from './apiPaths';

// export const uploadImage = async (imageFile) => {
//   const formData = new FormData();
//   formData.append("profileImage", imageFile);
// try{
//   const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//   });

//   return response.data;
// }catch (error) {
//     console.error("Error uploading the image:", error);
//     throw error;
//     }

//  };
// export default uploadImage;
