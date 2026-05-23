import Swal from 'sweetalert2';

const PRIMARY = '#2563EB'; // azul-600
const CANCEL = '#6B7280'; // gris-500

export const confirm = async ({
  title = '¿Confirmar?',
  text = '',
  icon = 'warning',
  confirmButtonText = 'Sí',
  cancelButtonText = 'Cancelar',
} = {}) => {
  const res = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: PRIMARY,
    cancelButtonColor: CANCEL,
    reverseButtons: true,
  });
  return Boolean(res && res.isConfirmed);
};

export const alert = async ({ title = 'Hecho', text = '', icon = 'success', timer = 2000 } = {}) => {
  return Swal.fire({
    title,
    text,
    icon,
    timer,
    showConfirmButton: false,
  });
};

export const toast = ({ title = '', icon = 'success', timer = 3000 } = {}) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
  });
  return Toast.fire({ icon, title });
};

export default Swal;
