
import Sidebar from "../components/sidebar";
import AreaText from "../components/AreaText";

function ChatPage() {
    return (
        <div>

            <div className="container-fluid">
                <div className="row">
                    
                    <div className="col-md-3">
            
                    <Sidebar />
                    
                    </div>
                    <div className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                        <AreaText/>
                    </div>
                    
                </div>
            </div>

        </div>
    );
}

export default ChatPage;