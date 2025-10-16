import { apiClient } from "@/services/ApiClient"

class NotesService {

    fetchNotes() {
        return apiClient.get('/notes/notes/me/');
    }

    createNote(data) {
        return apiClient.post('/notes/notes/', data);
    }

    //! CONSIDER REMOVING THIS ENDPOINT!!!!!!!!!!!!!!!!!!!!!!
    fetchSpecificNotes(id) {
        return apiClient.get(`/notes/notes/:${id}/`);
    }

    updateNote(id, data) {
        return apiClient.put(`/notes/notes/${id}/`, data);
    }

    deleteNote(id) {
        return apiClient.delete(`/notes/notes/${id}/`);
    }

    removeAccess(data) {
        return apiClient.delete(`/notes/notes/remove_access/`, { data: data });
    }

    shareNote(id, data) {
        return apiClient.post(`notes/notes/${id}/share/`, data);
    }

}

export default new NotesService
