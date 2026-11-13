// This file is no longer used after switching to Firebase.
// Keeping it here for reference or can be deleted.
/*
import { Vehicle, MaintenanceEntry } from '../types';

const STORAGE_KEY = 'vehicleMaintenanceData';

export const getData = (): Vehicle[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveData = (data: Vehicle[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addVehicle = (vehicle: Vehicle): void => {
  const data = getData();
  data.push(vehicle);
  saveData(data);
};

export const updateVehicle = (updatedVehicle: Vehicle): void => {
  let data = getData();
  data = data.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
  saveData(data);
};

export const deleteVehicle = (vehicleId: string): void => {
  let data = getData();
  data = data.filter(v => v.id !== vehicleId);
  saveData(data);
};

export const getVehicleById = (vehicleId: string): Vehicle | undefined => {
  const data = getData();
  return data.find(v => v.id === vehicleId);
};

export const addMaintenanceEntry = (vehicleId: string, entry: MaintenanceEntry): void => {
  const data = getData();
  const vehicle = data.find(v => v.id === vehicleId);
  if (vehicle) {
    vehicle.maintenanceHistory.push(entry);
    saveData(data);
  }
};

export const updateMaintenanceEntry = (vehicleId: string, updatedEntry: MaintenanceEntry): void => {
  const data = getData();
  const vehicle = data.find(v => v.id === vehicleId);
  if (vehicle) {
    vehicle.maintenanceHistory = vehicle.maintenanceHistory.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    saveData(data);
  }
};

export const deleteMaintenanceEntry = (vehicleId: string, entryId: string): void => {
  const data = getData();
  const vehicle = data.find(v => v.id === vehicleId);
  if (vehicle) {
    vehicle.maintenanceHistory = vehicle.maintenanceHistory.filter(e => e.id !== entryId);
    saveData(data);
  }
};
*/
