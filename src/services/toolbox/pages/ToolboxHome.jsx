import UnifiedConverter from './UnifiedConverter';
import OtherToolsHub from './OtherToolsHub';
import { AIServiceShell, CompactServiceHeader, AIBackLink } from '../../../components/AIServiceLayout';

export default function ToolboxHome() {
    return (
        <AIServiceShell>
            <div className="mb-2">
                <AIBackLink to="/">Home</AIBackLink>
            </div>
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
