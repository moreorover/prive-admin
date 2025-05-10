"use client";

import { noteSchema } from "@/lib/schemas";
import type { Note } from "@/lib/schemas";
import { Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Trash2 } from "lucide-react";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	note: Note;
	onSubmitAction: (values: Note) => void;
	onDelete?: () => void;
};

export const NoteForm = ({ note, onSubmitAction, onDelete }: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: note,
		validate: zodResolver(noteSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	function handleDelete() {
		onDelete?.();
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput
				label="Note"
				placeholder="Something to note..."
				required
				key={form.key("note")}
				{...form.getInputProps("note")}
			/>
			<Button fullWidth mt="xl" type="submit">
				{note.id ? "Update" : "Create"}
			</Button>
			{note.id && (
				<Button
					leftSection={<Trash2 />}
					fullWidth
					mt="xl"
					type="button"
					onClick={() => handleDelete()}
				>
					Delete
				</Button>
			)}
		</form>
	);
};
