import { Action, ActionPanel, Alert, Icon, LocalStorage, Toast, confirmAlert, showToast } from "@raycast/api";
import { Command, StoreCommand, isCommand, isStoreCommand } from "../../../lib/commands/types";
import CommandForm from "../CommandForm";
import { QUICKLINK_URL_BASE } from "../../../lib/constants";
import { updateCommand } from "../../../lib/commands/command-utils";
import { defaultAdvancedSettings } from "../../../data/default-advanced-settings";
import { anyActionsEnabled, getActionShortcut } from "../../../lib/action-utils";
import { commandDataForEditing } from "../../../lib/commands/Command";
import { installAllCommands } from "../../../lib/commands/StoreCommand";

/**
 * Section for actions related to modifying commands (editing, deleting, etc.).
 * @param props.command The command to modify
 * @param props.availableCommands The list of commands available to install
 * @param props.commands The list of all installed commands
 * @param props.setCommands The function to update the list of installed commands
 * @returns An ActionPanel.Section component
 */
export const CommandControlsActionsSection = (props: {
  command: Command | StoreCommand;
  availableCommands?: StoreCommand[];
  commands: Command[];
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { command, availableCommands, commands, setCommands, settings } = props;

  if (
    !anyActionsEnabled(
      [
        "ToggleFavoriteAction",
        "CreateQuickLinkAction",
        "EditCommandAction",
        "CreateDerivativeAction",
        "DeleteCommandAction",
        "DeleteAllCommandsAction",
        "InstallAllCommandsAction",
      ],
      settings,
    )
  ) {
    return null;
  }

  return (
    <ActionPanel.Section title="Command Controls">
      {isCommand(command) ? (
        <>
          <ToggleFavoriteAction command={command} setCommands={setCommands} settings={settings} />
          <CreateQuickLinkAction command={command} settings={settings} />
          <EditCommandAction command={command} setCommands={setCommands} settings={settings} />
          <CreateDerivativeAction command={command} setCommands={setCommands} settings={settings} />
          <DeleteCommandAction command={command} commands={commands} setCommands={setCommands} settings={settings} />
          <DeleteAllCommandsAction commands={commands} setCommands={setCommands} settings={settings} />
        </>
      ) : null}
      {isStoreCommand(command) ? (
        <>
          <InstallAllCommandsAction
            availableCommands={availableCommands || []}
            setCommands={setCommands}
            settings={settings}
          />
          <CreateDerivativeAction command={command} setCommands={setCommands} settings={settings} />
        </>
      ) : null}
    </ActionPanel.Section>
  );
};

/**
 * Action to toggle a command's favorited status.
 * @param props.command The command whose favorited status to toggle
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const ToggleFavoriteAction = (props: {
  command: Command;
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { command, setCommands, settings } = props;
  return (
    <Action
      title={command.favorited ? `Remove From Favorites` : `Add To Favorites`}
      icon={Icon.Star}
      shortcut={getActionShortcut("ToggleFavoriteAction", settings)}
      onAction={async () => {
        const newCmdData = { ...command, favorited: command.favorited == true ? false : true };
        await updateCommand(command, newCmdData, setCommands);
        await showToast({
          title: command.favorited ? `Removed From Favorites` : `Added To Favorites`,
          style: Toast.Style.Success,
        });
      }}
    />
  );
};

/**
 * Action to display the "Create QuickLink" view for a command.
 * @param props.command The command to create a QuickLink for
 * @returns An Action component
 */
export const CreateQuickLinkAction = (props: { command: Command; settings: typeof defaultAdvancedSettings }) => {
  const { command, settings } = props;
  return (
    <Action.CreateQuicklink
      quicklink={{
        link: `${QUICKLINK_URL_BASE}${encodeURIComponent(command.id)}%22${
          command.prompt?.includes("{{input}}") ? "%2C%22queryInput%22%3A%22{Input}%22" : ""
        }%7D`,
        name: command.name,
      }}
      shortcut={getActionShortcut("CreateQuickLinkAction", settings)}
    />
  );
};

/**
 * Action to display the "Edit Command" form for a command.
 * @param props.command The command to edit
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const EditCommandAction = (props: {
  command: Command;
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { command, setCommands, settings } = props;
  return (
    <Action.Push
      title="Edit Command"
      target={<CommandForm oldData={commandDataForEditing(command)} setCommands={setCommands} />}
      icon={Icon.Pencil}
      shortcut={getActionShortcut("EditCommandAction", settings)}
    />
  );
};

/**
 * Action to delete a single command.
 * @param props.command The command to delete
 * @param props.commands The list of installed commands
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const DeleteCommandAction = (props: {
  command: Command;
  commands: Command[];
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { command, commands, setCommands, settings } = props;
  return (
    <Action
      title="Delete Command"
      onAction={async () => {
        if (
          await confirmAlert({
            title: "Delete Command",
            message: "Are you sure?",
            primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
          })
        ) {
          const newCommands = commands.filter((cmd) => cmd.name != command.name);
          await LocalStorage.removeItem(command.name);
          setCommands(newCommands);
        }
      }}
      icon={Icon.Trash}
      style={Action.Style.Destructive}
      shortcut={getActionShortcut("DeleteCommandAction", settings)}
    />
  );
};

/**
 * Action to delete all commands.
 * @param props.commands The list of installed commands
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const DeleteAllCommandsAction = (props: {
  commands: Command[];
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { commands, setCommands, settings } = props;
  return (
    <Action
      title="Delete All Commands"
      onAction={async () => {
        if (
          await confirmAlert({
            title: "Delete All Commands",
            message: "Are you sure?",
            primaryAction: { title: "Delete All", style: Alert.ActionStyle.Destructive },
          })
        ) {
          commands.forEach(async (cmd) => await LocalStorage.removeItem(cmd.name));
          setCommands([]);
        }
      }}
      icon={Icon.Trash}
      style={Action.Style.Destructive}
      shortcut={getActionShortcut("DeleteAllCommandsAction", settings)}
    />
  );
};

/**
 * Action to display the "Create Derivative" form for a command.
 * @param props.command The command to create a derivative of
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const CreateDerivativeAction = (props: {
  command: Command | StoreCommand;
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { command, setCommands, settings } = props;

  return (
    <Action.Push
      title="Create Derivative"
      target={<CommandForm oldData={commandDataForEditing(command, true)} setCommands={setCommands} duplicate={true} />}
      icon={Icon.EyeDropper}
      shortcut={getActionShortcut("CreateDerivativeAction", settings)}
    />
  );
};

/**
 * Action to install all available commands from the store.
 * @param props.availableCommands The list of available commands
 * @param props.commands The list of installed commands
 * @param props.setCommands The function to update the list of installed commands
 * @returns An Action component
 */
export const InstallAllCommandsAction = (props: {
  availableCommands: StoreCommand[];
  setCommands: React.Dispatch<React.SetStateAction<Command[]>>;
  settings: typeof defaultAdvancedSettings;
}) => {
  const { availableCommands, setCommands, settings } = props;

  return (
    <Action
      title="Install All Commands"
      icon={Icon.Plus}
      shortcut={getActionShortcut("InstallAllCommandsAction", settings)}
      onAction={async () => installAllCommands(availableCommands, setCommands)}
    />
  );
};
