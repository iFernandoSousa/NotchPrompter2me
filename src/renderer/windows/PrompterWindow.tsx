import PrompterView from "../components/prompter/PrompterView";

export default function PrompterWindow() {
    return (
        <div className="h-full w-full bg-black overflow-hidden rounded-b-3xl pt-2">
            <PrompterView />
        </div>
    );
}
