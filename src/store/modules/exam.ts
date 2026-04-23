import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchSubjectList } from '@/service/api';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';

export const useExamStore = defineStore(`${SetupStoreId.Auth}-exam`, () => {
  const subjects = ref<Exam.Subject.Subject[]>([]);
  const currentSubjectId = ref<string>(localStg.get('lastLoginUserId') || '');
  const loading = ref(false);

  const currentSubject = computed(() =>
    subjects.value.find((s: Exam.Subject.Subject) => s.id === currentSubjectId.value)
  );

  async function loadSubjects() {
    loading.value = true;
    const { data, error } = await fetchSubjectList();
    if (!error && data) {
      subjects.value = data;
      if (!currentSubjectId.value && data.length > 0) {
        currentSubjectId.value = data[0].id;
      }
    }
    loading.value = false;
  }

  function setCurrentSubject(subjectId: string) {
    currentSubjectId.value = subjectId;
  }

  return {
    subjects,
    currentSubjectId,
    currentSubject,
    loading,
    loadSubjects,
    setCurrentSubject
  };
});
