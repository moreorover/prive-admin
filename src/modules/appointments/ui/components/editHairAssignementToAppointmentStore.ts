import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignmentId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditHairAssignmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignmentId: null,
	onSuccess: () => {},
};

const useEditHairAssignmentToAppointmentStore = create<
	State & { actions: Actions }
>((set) => ({
	...initialState,
	actions: {
		openEditHairAssignmentDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useEditHairAssignmentToAppointmentStoreDrawerIsOpen = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.isOpen);

export const useEditHairAssignmentToAppointmentStoreDrawerHairAssignmentId =
	() =>
		useEditHairAssignmentToAppointmentStore((state) => state.hairAssignmentId);

export const useEditHairAssignmentToAppointmentStoreDrawerOnUpdated = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.onSuccess);

export const useEditHairAssignmentToAppointmentStoreActions = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.actions);
