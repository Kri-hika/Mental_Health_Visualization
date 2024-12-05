// src/lib/stores/userDataStore.js
import { writable } from 'svelte/store';

const createUserDataStore = () => {
  const { subscribe, set, update } = writable({
    age: null,
    occupation: '',
    workHours: null,
    sleepHours: null,
    submitted: false
  });

  return {
    subscribe,
    setUserData: (data) => {
      update(store => ({
        ...store,
        ...data,
        submitted: true
      }));
    },
    reset: () => {
      set({
        age: null,
        occupation: '',
        workHours: null,
        sleepHours: null,
        submitted: false
      });
    }
  };
};

export const userDataStore = createUserDataStore();