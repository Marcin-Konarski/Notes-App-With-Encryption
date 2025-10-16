import { apiClient } from "@/services/ApiClient"

class EmailService {

    confirmEmail(data) {
        return apiClient.post('/users/activate/', data);
    }

    resendEmail(data) {
        return apiClient.post('/users/resend-email/', data)
    }
    
}

export default new EmailService