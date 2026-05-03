import UnifiedConverter from './UnifiedConverter';
import OtherToolsHub from './OtherToolsHub';
import { AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';

export default function ToolboxHome() {
    return (
        <AIServiceShell>
            <CompactServiceHeader
                eyebrow="Toolbox"
                title="Convert, edit, and package files"
                description="Drop a file and run the tool directly. Use CommandBar for cross-service jumps."
            />
            <UnifiedConverter />
            <OtherToolsHub />
        </AIServiceShell>
    );
}
