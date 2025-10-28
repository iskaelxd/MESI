

function AreaText() {

    return (
        <div className="position-fixed bottom-0  w-100 bg-white p-3" style={{ borderTop: '1px solid #dee2e6' }}>
            <div className="row">
                <div className="col-md-8">
                    <div className="form-outline" data-mdb-input-init>
                        <textarea className="form-control" id="textAreaExample" rows={3}></textarea>
                    </div>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                    <button type="button" className="btn btn-primary btn-rounded">Send</button>
                </div>
            </div>
        </div>
    )
}

export default AreaText;