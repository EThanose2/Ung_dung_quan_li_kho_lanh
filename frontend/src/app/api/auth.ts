import axiosClient from "./axiosClient";

export const loginApi = async (username: string, password?: string) => {
  // Gửi request tới backend theo đúng route @Post('login') trong AuthController
  const response = await axiosClient.post("/auth/login", { 
    username, 
    password 
  });
  return response.data; // Backend trả về object user
};