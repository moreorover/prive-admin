"use client";

import { type HairOrderNote, hairOrderNoteSchema } from "@/lib/schemas";
import { Button, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Trash2 } from "lucide-react";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	hairOrderNote: HairOrderNote;
	onSubmitAction: (values: HairOrderNote) => void;
	onDelete?: () => void;
};

export const HairOrderNoteForm = ({
	hairOrderNote,
	onSubmitAction,
	onDelete,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: hairOrderNote,
		validate: zodResolver(hairOrderNoteSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	function handleDelete() {
		onDelete?.();
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Textarea
				label="Note"
				placeholder="Your hairOrder note"
				required
				key={form.key("note")}
				{...form.getInputProps("note")}
			/>
			<Button fullWidth mt="xl" type="submit">
				{hairOrderNote.id ? "Update" : "Create"}
			</Button>
			{hairOrderNote.id && (
				<Button
					disabled
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
