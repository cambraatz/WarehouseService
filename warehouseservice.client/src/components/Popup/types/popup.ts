// define the popup categories at our disposal...
export type PopupType =  
    | "load"
    | "load_trailer_selection"
    | "load_ex_dv_conflict"
    | "unload"
    | "unload_selection"
    | "unload_selection_success"
    | "unload_selection_fail"
    | "unload_success"
    | "unload_fail"
    | "unload_package_list"
    | "return" 
    | "logout"
    | "fail"
    | "unauthorized";