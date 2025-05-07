import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignmentId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteHairAssignmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignmentId: null,
	onSuccess: () => {},
};

const useDeleteHairAssignmentToAppointmentStore = create<
	State & { actions: Actions }
>((set) => ({
	...initialState,
	actions: {
		openDeleteHairAssignmentDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useDeleteHairAssignmentToAppointmentStoreDrawerIsOpen = () =>
	useDeleteHairAssignmentToAppointmentStore((state) => state.isOpen);

export const useDeleteHairAssignmentToAppointmentStoreDrawerHairAssignmentId =
	() =>
		useDeleteHairAssignmentToAppointmentStore(
			(state) => state.hairAssignmentId,
		);

export const useDeleteHairAssignmentToAppointmentStoreDrawerOnDeleted = () =>
	useDeleteHairAssignmentToAppointmentStore((state) => state.onSuccess);

export const useDeleteHairAssignmentToAppointmentStoreActions = () =>
	useDeleteHairAssignmentToAppointmentStore((state) => state.actions);
