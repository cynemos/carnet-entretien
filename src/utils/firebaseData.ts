import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry, PreviousOwner } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from './firebaseStorage'; // Import Firebase Storage upload function (kept for CT, removed for Maintenance)

const vehiclesCollection = collection(db, 'vehicles');

// Helper to convert Firestore doc to Vehicle object
const docToVehicle = (doc: any): Vehicle => {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    make: data.make,
    model: data.model,
    year: data.year,
    initialMileage: data.initialMileage,
    purchaseDate: data.purchaseDate,
    firstRegistrationDate: data.firstRegistrationDate,
    vin: data.vin,
    imageUrl: data.imageUrl,
    carteGriseGoogleDriveLink: data.carteGriseGoogleDriveLink,
    licensePlate: data.licensePlate, // Added new field
    maintenanceHistory: data.maintenanceHistory || [],
    controleTechniqueHistory: data.controleTechniqueHistory || [],
    previousOwners: data.previousOwners || [],
  };
};

export const getVehicles = async (): Promise<Vehicle[]> => {
  const querySnapshot = await getDocs(vehiclesCollection);
  return querySnapshot.docs.map(docToVehicle);
};

export const getVehicleById = async (vehicleId: string): Promise<Vehicle | undefined> => {
  const docRef = doc(db, 'vehicles', vehicleId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docToVehicle(docSnap);
  } else {
    return undefined;
  }
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners'>): Promise<string> => {
  const docRef = await addDoc(vehiclesCollection, {
    ...vehicle,
    // Ensure the new fields are included, even if undefined
    carteGriseGoogleDriveLink: vehicle.carteGriseGoogleDriveLink || null,
    licensePlate: vehicle.licensePlate || null, // Added new field, convert empty string to null
    maintenanceHistory: [],
    controleTechniqueHistory: [],
    previousOwners: [],
  });
  return docRef.id;
};

export const updateVehicle = async (vehicleId: string, updatedVehicle: Partial<Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners'>>): Promise<void> => {
  const docRef = doc(db, 'vehicles', vehicleId);
  // Ensure the new fields are handled in updates, converting empty string to null
  const updateData = {
    ...updatedVehicle,
    ...(updatedVehicle.hasOwnProperty('carteGriseGoogleDriveLink') && {
      carteGriseGoogleDriveLink: updatedVehicle.carteGriseGoogleDriveLink || null
    }),
     ...(updatedVehicle.hasOwnProperty('licensePlate') && {
      licensePlate: updatedVehicle.licensePlate || null // Added new field, convert empty string to null
    })
  };
  await updateDoc(docRef, updateData);
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const docRef = doc(db, 'vehicles', vehicleId);
  await deleteDoc(docRef);
};

// Maintenance Entry Functions (nested within vehicle document)

// Updated addMaintenanceEntry to accept two Google Drive links
export const addMaintenanceEntry = async (vehicleId: string, entry: Omit<MaintenanceEntry, 'id' | 'totalCost' | 'invoiceUrl' | 'googleDriveLink1' | 'googleDriveLink2'> & { googleDriveLink1?: string, googleDriveLink2?: string }): Promise<string> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: MaintenanceEntry[] = vehicleData.maintenanceHistory || [];
    const newEntryId = uuidv4();
    const totalCost = entry.partsCost + entry.laborCost;

    // Convert empty strings to null for optional fields
    const googleDriveLink1 = entry.googleDriveLink1 || null;
    const googleDriveLink2 = entry.googleDriveLink2 || null;

    // Ensure invoiceUrl is explicitly set to null
    const newEntry: MaintenanceEntry = {
      ...entry,
      id: newEntryId,
      totalCost: totalCost,
      // Store the two Google Drive links, convert empty string to null
      googleDriveLink1: googleDriveLink1,
      googleDriveLink2: googleDriveLink2,
      invoiceUrl: null, // Set to null to avoid undefined issues
    };

    console.log("New maintenance entry to be added:", newEntry);

    const updatedHistory = [...currentHistory, newEntry];

    await updateDoc(vehicleRef, {
      maintenanceHistory: updatedHistory,
    });

    return newEntryId;
  } else {
    throw new Error("Vehicle not found");
  }
};

// Updated updateMaintenanceEntry to handle two Google Drive links
export const updateMaintenanceEntry = async (vehicleId: string, updatedEntry: MaintenanceEntry): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: MaintenanceEntry[] = vehicleData.maintenanceHistory || [];

    const updatedHistory = currentHistory.map(entry =>
      entry.id === updatedEntry.id ? {
        ...updatedEntry,
        totalCost: updatedEntry.partsCost + updatedEntry.laborCost, // Recalculate total
        // Update the two Google Drive links, convert empty string/undefined to null
        googleDriveLink1: updatedEntry.googleDriveLink1 || null,
        googleDriveLink2: updatedEntry.googleDriveLink2 || null,
        // invoiceUrl is not updated via file upload anymore
        invoiceUrl: updatedEntry.invoiceUrl || null, // Keep existing GCS URL if any, convert undefined to null
      } : entry
    );

    await updateDoc(vehicleRef, {
      maintenanceHistory: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};

export const deleteMaintenanceEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: MaintenanceEntry[] = vehicleData.maintenanceHistory || [];

    // TODO: Optionally delete the file from Storage here if invoiceUrl exists

    const updatedHistory = currentHistory.filter(entry => entry.id !== entryId);

    await updateDoc(vehicleRef, {
      maintenanceHistory: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};

// Controle Technique Entry Functions (nested within vehicle document)
// These functions still support file upload and one Google Drive link as per previous requirements

export const addControleTechniqueEntry = async (vehicleId: string, entry: Omit<ControleTechniqueEntry, 'id' | 'reportUrl' | 'googleDriveLink'> & { googleDriveLink?: string }, reportFile?: File): Promise<string> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: ControleTechniqueEntry[] = vehicleData.controleTechniqueHistory || [];
    const newEntryId = uuidv4();

    let reportUrl: string | null = null; // Initialize as null

    // If a file is provided, upload it to Storage
    if (reportFile) {
      const filePath = `controleTechnique/${vehicleId}/${newEntryId}_${reportFile.name}`;
      reportUrl = await uploadFile(reportFile, filePath);
    }

    const newEntry: ControleTechniqueEntry = {
      ...entry,
      id: newEntryId,
      reportUrl: reportUrl, // Store the download URL from GCS (or null)
      googleDriveLink: entry.googleDriveLink || null, // Store the Google Drive link (or null)
    };

    const updatedHistory = [...currentHistory, newEntry];

    await updateDoc(vehicleRef, {
      controleTechniqueHistory: updatedHistory,
    });

    return newEntryId;
  } else {
    throw new Error("Vehicle not found");
  }
};

export const updateControleTechniqueEntry = async (vehicleId: string, updatedEntry: ControleTechniqueEntry, reportFile?: File): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: ControleTechniqueEntry[] = vehicleData.controleTechniqueHistory || [];

    let reportUrl = updatedEntry.reportUrl; // Start with existing GCS URL from the passed updatedEntry

    // If a new file is provided, upload it to Storage
    if (reportFile) {
       // You might want to delete the old file first if it exists, but for simplicity, we'll just upload the new one.
      const filePath = `controleTechnique/${vehicleId}/${updatedEntry.id}_${reportFile.name}`;
      reportUrl = await uploadFile(reportFile, filePath);
    }

    const updatedHistory = currentHistory.map(entry => {
      if (entry.id === updatedEntry.id) {
        // Explicitly construct the updated entry, converting undefined or empty strings to null for optional fields
        const updated: ControleTechniqueEntry = {
          ...entry, // Keep original fields not explicitly updated (like id)
          date: updatedEntry.date,
          mileage: updatedEntry.mileage, // mileage should be a number, handled in component
          validity: updatedEntry.validity,
          minorFailures: updatedEntry.minorFailures || null,
          majorFailures: updatedEntry.majorFailures || null,
          ripage: updatedEntry.ripage || null,
          suspensionAsymmetry: updatedEntry.suspensionAsymmetry || null,
          verticalForces: updatedEntry.verticalForces || null,
          serviceBrake: updatedEntry.serviceBrake || null,
          parkingBrake: updatedEntry.parkingBrake || null,
          exhaustEmissions: updatedEntry.exhaustEmissions || null,
          headlights: updatedEntry.headlights || null,
          reportUrl: reportUrl || null, // Use the potentially updated reportUrl, convert undefined to null
          googleDriveLink: updatedEntry.googleDriveLink || null, // Use the updated googleDriveLink, convert empty string/undefined to null
        };
        return updated;
      }
      return entry;
    });

    console.log("Updating CT entry in Firestore:", updatedHistory); // Log data before update

    await updateDoc(vehicleRef, {
      controleTechniqueHistory: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};

export const deleteControleTechniqueEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: ControleTechniqueEntry[] = vehicleData.controleTechniqueHistory || [];

    // TODO: Optionally delete the file from Storage here if reportUrl exists

    const updatedHistory = currentHistory.filter(entry => entry.id !== entryId);

    await updateDoc(vehicleRef, {
      controleTechniqueHistory: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};

// Previous Owner Functions (nested within vehicle document)

export const addPreviousOwnerEntry = async (vehicleId: string, entry: Omit<PreviousOwner, 'id' | 'duration'>): Promise<string> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: PreviousOwner[] = vehicleData.previousOwners || [];
    const newEntryId = uuidv4();

    const newEntry: PreviousOwner = {
      ...entry,
      id: newEntryId,
      // Duration will be calculated on the frontend
    };

    const updatedHistory = [...currentHistory, newEntry];

    await updateDoc(vehicleRef, {
      previousOwners: updatedHistory,
    });

    return newEntryId;
  } else {
    throw new Error("Vehicle not found");
  }
};

export const updatePreviousOwnerEntry = async (vehicleId: string, updatedEntry: PreviousOwner): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: PreviousOwner[] = vehicleData.previousOwners || [];

    const updatedHistory = currentHistory.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );

    await updateDoc(vehicleRef, {
      previousOwners: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};

export const deletePreviousOwnerEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const currentHistory: PreviousOwner[] = vehicleData.previousOwners || [];

    const updatedHistory = currentHistory.filter(entry => entry.id !== entryId);

    await updateDoc(vehicleRef, {
      previousOwners: updatedHistory,
    });
  } else {
    throw new Error("Vehicle not found");
  }
};
